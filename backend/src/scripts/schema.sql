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

-- Added this to ensure only valid cart states can be inserted
ALTER TABLE Cart
ADD CONSTRAINT chk_cart_status CHECK (Status IN ('Active', 'Completed'));

CREATE TABLE CartItem (
  CartID INT REFERENCES Cart(CartID) ON DELETE CASCADE,
  ProductID INT REFERENCES Product(ProductID) ON DELETE CASCADE,
  Quantity INT NOT NULL,
  PRIMARY KEY (CartID, ProductID)
);

CREATE TABLE "Order" (
  OrderID SERIAL PRIMARY KEY,
  CustomerID INT REFERENCES Customer(CustomerID) ON DELETE SET NULL,
  OrderDate TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  -- FIXED: Added CHECK constraint
  Status VARCHAR(50) DEFAULT 'Pending'
    CHECK (Status IN ('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled')),
  TotalAmount DECIMAL(10,2) NOT NULL CHECK (TotalAmount >= 0),
  ShippingAddress VARCHAR(255)
);

CREATE TABLE OrderItem (
  OrderID INT REFERENCES "Order"(OrderID) ON DELETE CASCADE,
  ProductID INT REFERENCES Product(ProductID) ON DELETE RESTRICT,
  Quantity INT NOT NULL CHECK (Quantity > 0),
  UnitPriceAtOrder DECIMAL(10,2) NOT NULL CHECK (UnitPriceAtOrder >= 0),
  PRIMARY KEY (OrderID, ProductID)
);

CREATE TABLE Payment (
  PaymentID SERIAL PRIMARY KEY,
  OrderID INT NOT NULL REFERENCES "Order"(OrderID) ON DELETE RESTRICT,
  Amount DECIMAL(10,2) NOT NULL CHECK(Amount >= 0),
  Status VARCHAR(50) CHECK (Status IN ('Pending', 'Succeeded', 'Failed')),
  CreatedAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE AuditLog (
  LogID SERIAL PRIMARY KEY,
  actionDesc VARCHAR(100) NOT NULL, 
  EntityType VARCHAR(50) NOT NULL,
  EntityID INT NOT NULL,
  Timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
