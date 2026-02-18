# API Object Keys Reference

This document defines the object keys used in API requests and responses, extracted from the Figma designs.

## Authentication

### Register Request
```typescript
{
  name: string;              // User's full name
  email: string;             // Unique email address
  password: string;          // Password (min 8 chars, must contain uppercase, lowercase, number)
  confirmPassword: string;  // Password confirmation (must match password)
  userType: "INDIVIDUAL" | "COMPANY";  // User type selection
  username?: string;         // Optional unique username
  termsAccepted: boolean;    // Must be true to register
}
```

### Login Request
```typescript
{
  email: string;    // User's email
  password: string; // User's password
}
```

### Auth Response
```typescript
{
  message: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: "SELLER" | "BUYER";
    userType: "INDIVIDUAL" | "COMPANY";
    username?: string;
    createdAt: string;
    updatedAt: string;
  };
  token: string;  // JWT token for authentication
}
```

## Listings

### Create Listing Request
```typescript
{
  title: string;                    // Listing title (e.g., "Grade A Plastic Scrap")
  description?: string;             // Optional description
  materialType: "WOOD" | "METAL" | "PLASTIC" | "GLASS" | "CARDBOARD" | "ELECTRONICS" | "TEXTILES" | "OTHER";
  quantity: number;                 // Quantity available
  unit?: "kg" | "tons" | "lbs" | "pieces";  // Unit of measurement (default: "kg")
  price: number;                    // Price per unit
  currency?: string;                // Currency code (default: "NGN")
  latitude?: number;                 // Location latitude (-90 to 90)
  longitude?: number;               // Location longitude (-180 to 180)
  location?: string;                 // Human-readable location (e.g., "Lagos, Nigeria")
  notes?: string;                   // Special instructions or notes
  imageUrl?: string;                // S3 URL if image already uploaded
  // OR include image file in multipart/form-data
}
```

### Create Listing Response
```typescript
{
  message: string;
  listing: {
    id: string;
    title: string;
    description?: string;
    materialType: string;
    quantity: number;
    unit: string;
    price: number;
    currency: string;
    imageUrl?: string;
    latitude?: number;
    longitude?: number;
    location?: string;
    status: "ACTIVE" | "PENDING" | "COMPLETED" | "SOLD" | "CANCELLED";
    notes?: string;
    co2Saved?: number;
    recyclability?: number;
    seller: {
      id: string;
      name: string;
      email: string;
      username?: string;
    };
    createdAt: string;
    updatedAt: string;
  };
}
```

### Get Feed Query Parameters
```typescript
{
  latitude?: number;        // User's latitude for proximity filtering
  longitude?: number;       // User's longitude for proximity filtering
  radius?: number;          // Search radius in kilometers
  materialType?: string;    // Filter by material type
  minPrice?: number;        // Minimum price filter
  maxPrice?: number;        // Maximum price filter
  limit?: number;           // Number of results (default: 50, max: 100)
  offset?: number;          // Pagination offset (default: 0)
}
```

### Feed Response
```typescript
{
  listings: Listing[];      // Array of listing objects
  scores: Array<{
    listingId: string;
    score: number;          // Ranking score (0-1)
  }>;
  count: number;            // Number of listings returned
}
```

### Update Listing Status Request
```typescript
{
  status: "ACTIVE" | "PENDING" | "COMPLETED" | "SOLD" | "CANCELLED";
}
```

## Transactions

### Create Transaction Request
```typescript
{
  listingId: string;  // UUID of the listing to purchase
  quantity: number;   // Quantity to purchase (must be <= available quantity)
}
```

### Create Transaction Response
```typescript
{
  message: string;
  transaction: {
    id: string;
    listingId: string;
    buyerId: string;
    sellerId: string;
    status: "PENDING" | "COMPLETED" | "CANCELLED" | "FAILED";
    price: number;        // Total price (listing.price * quantity)
    quantity: number;
    co2Saved?: number;   // Calculated CO2 savings
    listing: Listing;
    buyer: {
      id: string;
      name: string;
      email: string;
      username?: string;
    };
    seller: {
      id: string;
      name: string;
      email: string;
      username?: string;
    };
    createdAt: string;
    updatedAt: string;
  };
}
```

### Update Transaction Status Request
```typescript
{
  status: "PENDING" | "COMPLETED" | "CANCELLED" | "FAILED";
}
```

### Get My Transactions Query Parameters
```typescript
{
  type?: "buyer" | "seller";  // Filter by transaction role
}
```

## Dashboard Data (Producer Dashboard)

Based on the Figma designs, the producer dashboard would typically fetch:

### Dashboard Metrics Response
```typescript
{
  metrics: {
    totalListings: {
      count: number;
      active: number;
      change: number;      // Percentage change (e.g., +4.5%)
    };
    totalEarnings: {
      amount: number;
      currency: string;
      change: number;      // Percentage change (e.g., +12%)
    };
    offersReceived: {
      pending: number;
      new: number;         // New offers count
    };
    wasteDiverted: {
      amount: number;      // In tons
      change: number;      // Change amount (e.g., +2.1t)
    };
  };
  sustainability: {
    co2Savings: number;   // CO2 savings in kg/month
    recyclability: number; // Percentage
  };
  recentListings: Listing[];
  producerLevel: {
    tier: string;         // e.g., "Tier 2: Gold"
    progress: number;     // Percentage (e.g., 85%)
  };
}
```

## Error Responses

### Standard Error Format
```typescript
{
  error: string;          // Error message
  details?: Array<{      // Validation errors (if applicable)
    field: string;
    message: string;
  }>;
}
```

## File Upload

### Image Upload (Multipart Form Data)
- Field name: `image`
- Accepted formats: JPEG, PNG, WebP
- Maximum size: 10MB
- Content-Type: `multipart/form-data`

## Authentication Header

All protected endpoints require:
```
Authorization: Bearer <jwt-token>
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

