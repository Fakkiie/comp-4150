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

-- Function to reduce product stock
CREATE OR REPLACE FUNCTION DecrementStock(p_ProductID INT, p_Qty INT)
RETURNS VOID AS $$
BEGIN
  UPDATE Product
  SET StockQty = StockQty - p_Qty
  WHERE ProductID = p_ProductID;

  INSERT INTO AuditLog(EntityType, Action)
  VALUES ('Product', 'Reduced stock for Product ' || p_ProductID || ' by ' || p_Qty);
END;
$$ LANGUAGE plpgsql;

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

CREATE TRIGGER check_stock_trigger
BEFORE UPDATE ON Product
FOR EACH ROW
EXECUTE FUNCTION CheckStock();

-- Trigger to log product updates
CREATE OR REPLACE FUNCTION LogProductUpdate()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO AuditLog(EntityType, Action)
  VALUES ('Product', 'Product ' || NEW.ProductID ||
          ' updated. New stock: ' || NEW.StockQty ||
          ', New price: ' || NEW.UnitPrice);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER product_update_trigger
AFTER UPDATE ON Product
FOR EACH ROW
EXECUTE FUNCTION LogProductUpdate();

-- Testing section
SELECT DecrementStock(1, 2);
SELECT * FROM AuditLog ORDER BY Timestamp DESC;
