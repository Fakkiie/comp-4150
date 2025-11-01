-- Customers
INSERT INTO Customer (Email, FullName, PasswordHash) VALUES
('emma.jones@example.com', 'Emma Jones', 'hash123'),
('michael.smith@example.com', 'Michael Smith', 'hash456'),
('sophia.wilson@example.com', 'Sophia Wilson', 'hash789');

-- Products
INSERT INTO Product (Name, UnitPrice, StockQty) VALUES
('Wireless Mouse', 24.99, 100),
('Mechanical Keyboard', 79.99, 50),
('Laptop Stand', 39.99, 80),
('Noise Cancelling Headphones', 149.99, 30),
('Smartwatch', 199.99, 20),
('USB-C Hub', 34.99, 200),
('Portable SSD 1TB', 129.99, 40);

-- Carts
INSERT INTO Cart (CustomerID, Status, Total) VALUES
(1, 'Active', 104.98),
(2, 'Active', 149.99),
(3, 'Active', 39.99);

-- Cart Items
INSERT INTO CartItem (CartID, ProductID, Quantity) VALUES
(1, 1, 2),     -- 2x Wireless Mouse
(2, 4, 1),     -- 1x Headphones
(3, 3, 1);     -- 1x Laptop Stand

-- Orders
INSERT INTO "Order" (CustomerID, Status, TotalAmount, ShippingAddress) VALUES
(1, 'Shipped', 194.95, '123 King Street, Windsor, ON'),
(2, 'Pending', 149.99, '88 Queen Street, Toronto, ON'),
(3, 'Processing', 199.99, '45 River Road, London, ON');

-- Order Items
INSERT INTO OrderItem (OrderID, ProductID, Quantity, UnitPriceAtOrder) VALUES
(1, 2, 1, 79.99),
(1, 3, 1, 39.99),
(1, 1, 3, 24.99),
(2, 4, 1, 149.99),
(3, 5, 1, 199.99);

-- Payments
INSERT INTO Payment (OrderID, Amount, Status) VALUES
(1, 194.95, 'Succeeded'),
(2, 149.99, 'Pending'),
(3, 199.99, 'Failed');

-- Audit Logs
INSERT INTO AuditLog ( ActionDesc, EntityType, EntityID)
VALUES
('Initial database seed completed', 'System', 0),
('Inserted base product dataset', 'Product', 0),
('Inserted 3 initial customers', 'Customer', 0);
