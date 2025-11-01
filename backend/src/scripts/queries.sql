-- Step 4 – Implementation
-- Contributors | Emad Elmontaser
-- Products Module + Security Lead

-- Product Queries
SELECT * FROM Product ORDER BY ProductID;
SELECT * FROM Product WHERE Name ILIKE '%mouse%';
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

-- Stored Procedure: Decrement product stock
CREATE OR REPLACE FUNCTION DecrementStock(p_ProductID INT, p_Qty INT)
RETURNS VOID AS $$
BEGIN
  UPDATE Product
  SET StockQty = StockQty - p_Qty
  WHERE ProductID = p_ProductID;

  INSERT INTO AuditLog(EntityType, Action)
  VALUES ('Product', CONCAT('Decremented ', p_Qty, ' units for Product ', p_ProductID));
END;
$$ LANGUAGE plpgsql;

-- Trigger: Prevent negative stock
CREATE OR REPLACE FUNCTION CheckStock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.StockQty < 0 THEN
    RAISE EXCEPTION 'Stock cannot be negative';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_stock
BEFORE UPDATE ON Product
FOR EACH ROW
EXECUTE FUNCTION CheckStock();

-- Trigger: Log product updates
CREATE OR REPLACE FUNCTION LogProductUpdate()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO AuditLog(EntityType, Action)
  VALUES ('Product', CONCAT('Product ID ', NEW.ProductID, ' updated: Stock = ', NEW.StockQty, ', Price = ', NEW.UnitPrice));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_product_update
AFTER UPDATE ON Product
FOR EACH ROW
EXECUTE FUNCTION LogProductUpdate();

-- Test Queries
CALL DecrementStock(1, 2);
SELECT * FROM Product WHERE ProductID = 1;
SELECT * FROM AuditLog ORDER BY Timestamp DESC;
