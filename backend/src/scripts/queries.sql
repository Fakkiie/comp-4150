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

-- Testing section
SELECT DecrementStock(1, 2);
SELECT * FROM AuditLog ORDER BY Timestamp DESC;