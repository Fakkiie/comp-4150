CREATE TABLE Customer (
  CustomerID SERIAL PRIMARY KEY,
  Email VARCHAR(255) UNIQUE NOT NULL,
  FullName VARCHAR(255),
  PasswordHash VARCHAR(255) NOT NULL
);

CREATE TABLE Product (
  ProductID SERIAL PRIMARY KEY,
  Name VARCHAR(255) NOT NULL,
  UnitPrice DECIMAL(10,2) NOT NULL,
  StockQty INT NOT NULL
);

CREATE TABLE Cart (
  CartID SERIAL PRIMARY KEY,
  CustomerID INT REFERENCES Customer(CustomerID) ON DELETE CASCADE,
  Status VARCHAR(50),
  Total DECIMAL(10,2)
);

CREATE TABLE CartItem (
  CartID INT REFERENCES Cart(CartID) ON DELETE CASCADE,
  ProductID INT REFERENCES Product(ProductID) ON DELETE CASCADE,
  Quantity INT NOT NULL,
  PRIMARY KEY (CartID, ProductID)
);

CREATE TABLE "Order" (
  OrderID SERIAL PRIMARY KEY,
  CustomerID INT REFERENCES Customer(CustomerID),
  Status VARCHAR(50),
  TotalAmount DECIMAL(10,2),
  ShippingAddress VARCHAR(255)
);

CREATE TABLE OrderItem (
  OrderID INT REFERENCES "Order"(OrderID),
  ProductID INT REFERENCES Product(ProductID),
  Quantity INT,
  UnitPriceAtOrder DECIMAL(10,2),
  PRIMARY KEY (OrderID, ProductID)
);

CREATE TABLE Payment (
  PaymentID SERIAL PRIMARY KEY,
  OrderID INT REFERENCES "Order"(OrderID),
  Amount DECIMAL(10,2),
  Status VARCHAR(50)
);

CREATE TABLE AuditLog (
  LogID SERIAL PRIMARY KEY,
  EntityType VARCHAR(100),
  Action TEXT,
  Timestamp TIMESTAMP DEFAULT NOW()
);
