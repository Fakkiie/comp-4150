-- Product Queries
SELECT * FROM Product WHERE Name LIKE '%Mouse%';
SELECT * FROM Product WHERE UnitPrice BETWEEN 20 AND 100;
SELECT * FROM Product WHERE StockQty > 0 ORDER BY Name;
SELECT * FROM Product WHERE StockQty < 20;

-- Analytical Queries
SELECT COUNT(*) AS TotalProducts FROM Product;
SELECT ROUND(AVG(UnitPrice), 2) AS AveragePrice FROM Product;

SELECT o.OrderID, p.Name AS ProductName, oi.Quantity, oi.UnitPriceAtOrder
FROM "Order" o
JOIN OrderItem oi ON o.OrderID = oi.OrderID
JOIN Product p ON oi.ProductID = p.ProductID
ORDER BY o.OrderID;

-- Trigger to prevent negative stock
CREATE OR REPLACE FUNCTION CheckStock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.StockQty < 0 THEN
    RAISE EXCEPTION 'Stock quantity cannot be negative';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- This line "cleans up" the old trigger before creating the new one.
DROP TRIGGER IF EXISTS check_stock_trigger ON Product;

CREATE TRIGGER check_stock_trigger
BEFORE UPDATE ON Product
FOR EACH ROW
EXECUTE FUNCTION CheckStock();

-- changes were needed due to new auditLog table
CREATE OR REPLACE FUNCTION DecrementStock(p_ProductID INT, p_Qty INT)
RETURNS VOID AS $$
BEGIN

  UPDATE Product
  SET StockQty = StockQty - p_Qty
  WHERE ProductID = p_ProductID;

  INSERT INTO AuditLog(actionDesc, EntityType, EntityID)
  VALUES (
    'Stock reduced by ' || p_Qty,
    'Product',
    p_ProductID
  );
END;
$$ LANGUAGE plpgsql;

-- Function to add stock back (for cancelled orders)
CREATE OR REPLACE FUNCTION IncrementStock(p_ProductID INT, p_Qty INT)
RETURNS VOID AS $$
BEGIN
  -- Add the quantity back to the product's stock
  UPDATE Product
  SET StockQty = StockQty + p_Qty
  WHERE ProductID = p_ProductID;
  -- Log this action in the audit log
  INSERT INTO AuditLog(actionDesc, EntityType, EntityID)
  VALUES (
    'Stock increased by ' || p_Qty,
    'Product',
    p_ProductID
  );
END;
$$ LANGUAGE plpgsql;


-- cancel Order --
CREATE OR REPLACE FUNCTION CancelOrder(p_OrderID INT)
RETURNS TEXT AS $$
DECLARE
  v_Order_Status VARCHAR(50);
  item RECORD;
BEGIN
  -- First, get the current order status
  SELECT Status INTO v_Order_Status
  FROM "Order"
  WHERE OrderID = p_OrderID;

  -- Check if the order can be cancelled
  IF v_Order_Status NOT IN ('Pending', 'Processing') THEN
    RETURN 'Error: Order cannot be cancelled. Status: ' || v_Order_Status;
  END IF;

  -- 1. Update the order status
  UPDATE "Order"
  SET Status = 'Cancelled'
  WHERE OrderID = p_OrderID;

  -- 2. Update the payment status 
  UPDATE Payment
  SET Status = 'Failed' -- or 'Refunded' if payment succeeded
  WHERE OrderID = p_OrderID AND Status = 'Pending';

  -- 3. Loop through all items in the order and restock them
  FOR item IN
    SELECT ProductID, Quantity FROM OrderItem WHERE OrderID = p_OrderID
  LOOP
    -- Use the function we just made!
    PERFORM IncrementStock(item.ProductID, item.Quantity);
  END LOOP;

  -- 4. Log this action
  INSERT INTO AuditLog(actionDesc, EntityType, EntityID)
  VALUES ('Order Cancelled', 'Order', p_OrderID);

  RETURN 'Order ' || p_OrderID || ' has been cancelled and items restocked.';
  
END;
$$ LANGUAGE plpgsql;

-- 'Checkout' function: Converts a Cart into a formal Order.
CREATE OR REPLACE FUNCTION CreateOrderFromCart(
  p_CustomerID INT,
  p_ShippingAddress VARCHAR(255)
)
RETURNS INT AS $$ -- Returns the new OrderID
DECLARE
  v_CartID INT;
  v_TotalAmount DECIMAL(10,2);
  v_OrderID INT;
  item RECORD; -- A variable to hold rows from our loops
BEGIN
  -- 1. Get the customer's active cart and total
  SELECT CartID, Total INTO v_CartID, v_TotalAmount
  FROM Cart
  WHERE CustomerID = p_CustomerID AND Status = 'Active';

  -- Fail if they have no active cart
  IF v_CartID IS NULL THEN
    RAISE EXCEPTION 'No active cart found for customer %', p_CustomerID;
  END IF;

  -- 2.Check stock for all items before creating the order
  RAISE NOTICE 'Starting stock check for CartID %...', v_CartID;
  FOR item IN
    SELECT 
      p.Name AS ProductName, 
      ci.Quantity AS QuantityNeeded, 
      p.StockQty AS StockAvailable
    FROM CartItem ci
    JOIN Product p ON ci.ProductID = p.ProductID
    WHERE ci.CartID = v_CartID
  LOOP
    -- If any item is out of stock, fail the ENTIRE transaction.
    IF item.StockAvailable < item.QuantityNeeded THEN
      RAISE EXCEPTION 'Out of Stock: Not enough %, (Need: %, Have: %)', 
        item.ProductName, item.QuantityNeeded, item.StockAvailable;
    END IF;
  END LOOP;
  RAISE NOTICE 'Stock check passed.';

  -- 3. Create the new "Order" with 'Pending' status
  INSERT INTO "Order" (CustomerID, TotalAmount, ShippingAddress, Status)
  VALUES (p_CustomerID, v_TotalAmount, p_ShippingAddress, 'Pending') -- Status is 'Pending'
  RETURNING OrderID INTO v_OrderID; -- Get the new OrderID

  -- 4. second pass: Copy CartItems to OrderItems and Decrement Stock
  FOR item IN
    SELECT 
      ci.ProductID, 
      ci.Quantity, 
      p.UnitPrice -- Get the price at the time of order
    FROM CartItem ci
    JOIN Product p ON ci.ProductID = p.ProductID
    WHERE ci.CartID = v_CartID
  LOOP
    -- 4a. Copy the item to the new OrderItem table
    INSERT INTO OrderItem (OrderID, ProductID, Quantity, UnitPriceAtOrder)
    VALUES (v_OrderID, item.ProductID, item.Quantity, item.UnitPrice);

    -- 4b. Decrement the stock
    PERFORM DecrementStock(item.ProductID, item.Quantity);
  END LOOP;

  -- 5. Create the 'Pending' Payment record 
  INSERT INTO Payment (OrderID, Amount, Status)
  VALUES (v_OrderID, v_TotalAmount, 'Pending');

  -- 6. Clear the cart
  DELETE FROM CartItem WHERE CartID = v_CartID;
  UPDATE Cart SET Status = 'Completed', Total = 0 WHERE CartID = v_CartID;

  -- 7. Log this final action 
  INSERT INTO AuditLog(actionDesc, EntityType, EntityID)
  VALUES ('Order Created from Cart', 'Order', v_OrderID);

  -- 8. Return the new OrderID to the application
  RAISE NOTICE 'Successfully created OrderID %', v_OrderID;
  RETURN v_OrderID;
END;
$$ LANGUAGE plpgsql;
-- Function to be called by the backend server after MOCK validation succeeds
CREATE OR REPLACE FUNCTION HandlePaymentSuccess(p_OrderID INT)
RETURNS VOID AS $$
DECLARE
  v_PaymentID INT;
BEGIN
  -- 1. Update the payment status to 'Succeeded'
  UPDATE Payment
  SET Status = 'Succeeded'
  WHERE OrderID = p_OrderID AND Status = 'Pending'
  RETURNING PaymentID INTO v_PaymentID;

  -- If we successfully updated the payment, log it and update the order
  IF v_PaymentID IS NOT NULL THEN
    -- 2. Update the Order status to 'Processing'
    UPDATE "Order" 
    SET Status = 'Processing' 
    WHERE OrderID = p_OrderID AND Status = 'Pending';
    
    -- 3. Log the successful payment 
    INSERT INTO AuditLog(actionDesc, EntityType, EntityID)
    VALUES ('Payment Succeeded', 'Payment', v_PaymentID);
  END IF;
  
END;
$$ LANGUAGE plpgsql;

-- Function to be called by the backend server after MOCK validation fails
CREATE OR REPLACE FUNCTION HandlePaymentFailure(p_OrderID INT)
RETURNS VOID AS $$
DECLARE
  v_PaymentID INT;
BEGIN
  -- 1. Update the payment status to 'Failed'
  UPDATE Payment
  SET Status = 'Failed'
  WHERE OrderID = p_OrderID AND Status = 'Pending'
  RETURNING PaymentID INTO v_PaymentID;

  -- 2. Log the failed payment 
  IF v_PaymentID IS NOT NULL THEN
    INSERT INTO AuditLog(actionDesc, EntityType, EntityID)
    VALUES ('Payment Failed', 'Payment', v_PaymentID);
  END IF;
  
END;
$$ LANGUAGE plpgsql;

-- Testing section
SELECT CancelOrder(2);
SELECT * FROM "Order" WHERE OrderID = 2; -- Check status is 'Cancelled'
SELECT * FROM Product WHERE ProductID = 4; -- Check stock for Headphones
SELECT * FROM AuditLog ORDER BY Timestamp DESC;

-- Customer Queries

-- View all customers
SELECT * FROM Customer;

-- Find a customer by email
SELECT * FROM Customer WHERE Email = 'emma.jones@example.com';

-- Update customer name
UPDATE Customer
SET FullName = 'Emma J. Jones'
WHERE CustomerID = 1;

-- Update customer password
UPDATE Customer
SET PasswordHash = 'newsecurehash123'
WHERE Email = 'michael.smith@example.com';

-- Function: update customer email
CREATE OR REPLACE FUNCTION UpdateCustomerEmail(
  p_CustomerID INT,
  p_NewEmail VARCHAR
)
RETURNS VOID AS $$
BEGIN
  UPDATE Customer
  SET Email = p_NewEmail
  WHERE CustomerID = p_CustomerID;

  INSERT INTO AuditLog(actionDesc, EntityType, EntityID)
  VALUES ('Customer email updated', 'Customer', p_CustomerID);
END;
$$ LANGUAGE plpgsql;

-- Test section
SELECT UpdateCustomerEmail(2, 'mike.smith@example.com');
SELECT * FROM Customer;
SELECT * FROM AuditLog WHERE EntityType = 'Customer' ORDER BY Timestamp DESC;
