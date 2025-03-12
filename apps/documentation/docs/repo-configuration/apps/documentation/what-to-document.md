---
sidebar_position: 3
---

# What to Document

This guide outlines the documentation requirements for our projects at Labrys. Proper documentation is a critical part of our development workflow and is required for PR approval.

## Documentation Principles

1. **Document as you code**: Documentation should be written alongside feature development, not after completion. This can aid in problem solving while developing new features, and assist with updating or refactoring existing ones.
2. **Be concise but comprehensive**: Provide enough detail to understand the functionality without being unnecessarily verbose
3. **Use examples**: Include code snippets and usage examples wherever applicable
4. **Keep it updated**: Documentation must be updated when the related code changes
5. **Don't duplicate code**: Reference source files instead of copying complete implementations

## Documentation Location Requirements

Our documentation is split between Docusaurus and in-code JSDoc:

### Required in Docusaurus:

- Features
- Data Models
- Configuration

### Required as JSDoc in code:

- API Endpoints (tRPC)
- Components
- Utility Functions

All documentation types are required for PR approval, regardless of where they are located.

## Required Documentation

### 1. Feature Documentation (in Docusaurus)

All major features must be documented with:

- **Purpose**: What problem does this feature solve?
- **Implementation**: High-level overview of how it's implemented
- **Configuration**: Any environment variables or configuration options
- **Usage**: How to use the feature with simple examples
- **Limitations**: Any known limitations or edge cases
- **Future improvements**: Planned enhancements (if applicable)

Example:

````markdown
## Authentication Feature

### Purpose

Provides JWT-based authentication for users with role-based access control.

### Implementation

Uses NextAuth.js with custom JWT handling and MongoDB adapter for user storage.
Key files:

- `src/lib/auth.ts` - Main auth configuration
- `src/pages/api/auth/[...nextauth].ts` - NextAuth API routes

### Configuration

Required environment variables:

- `JWT_SECRET`: Secret key for JWT signing
- `AUTH_EXPIRY`: Token expiration time in seconds (default: 86400)

### Usage

```tsx
// Client-side authentication
import { useAuth } from "@/hooks/useAuth";

function ProtectedComponent() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner />;
  if (!user) return <LoginRedirect />;

  return <div>Protected content</div>;
}
```

### Limitations

- Social login currently only supports Google and GitHub
- Password reset has a 10-minute token expiration

### Future improvements

- Add Microsoft authentication provider
- Implement 2FA support
````

### 2. API Documentation (in JSDoc)

For tRPC endpoints, document in the code using JSDoc:

```ts
/**
 * Retrieves user details by ID or email
 *
 * @example
 * // Query by ID
 * const user = await trpc.user.getUser.query({ id: "507f1f77bcf86cd799439011" });
 *
 * // Query by email
 * const user = await trpc.user.getUser.query({ email: "user@example.com" });
 *
 * @input User ID or email (at least one required)
 * @output User object with basic profile information
 * @auth Requires authentication. Users can access their own data. Admins can access any user data.
 */
export const getUser = protectedProcedure
  .input(
    z
      .object({
        id: z.string().optional(),
        email: z.string().email().optional(),
      })
      .refine((data) => data.id || data.email, {
        message: "Either id or email must be provided",
      }),
  )
  .query(async ({ input, ctx }) => {
    // Implementation
  });
```

### 3. Data Models Documentation (in Docusaurus)

For Typegoose models/classes:

- **Model purpose**: What entity the model represents
- **Location**: Where the model is defined (file path)
- **Key fields**: Important fields and their purpose (no need to list all fields)
- **Relationships**: How this model relates to other models
- **Special behaviors**: Any important custom methods, virtuals, or hooks

Example:

```markdown
## Product Model

### Purpose

Represents products in the e-commerce system.

### Location

`src/models/Product.ts`

### Key Fields

- `name`: Product display name
- `price`: Base price in cents
- `inventoryCount`: Current stock level
- `category`: Reference to the product category
- `tags`: Array of searchable tags

### Relationships

- Belongs to one `Category`
- Referenced by many `OrderItem`

### Special Behaviors

- Auto-updates timestamps on save
- `isAvailable()` method checks if product is in stock
- `getDiscountedPrice()` calculates price after applying discount
```

### 4. Component Documentation (in JSDoc)

For reusable React components, document in the code using JSDoc:

```tsx
/**
 * A customizable button component that supports different variants and sizes
 *
 * @component
 * @example
 * // Primary button (default)
 * <Button onClick={handleClick}>Save Changes</Button>
 *
 * // Secondary small button
 * <Button variant="secondary" size="sm">Cancel</Button>
 *
 * // Disabled danger button
 * <Button variant="danger" disabled>Delete Account</Button>
 *
 * @prop {('primary'|'secondary'|'tertiary'|'danger')} [variant='primary'] - Visual style
 * @prop {('sm'|'md'|'lg')} [size='md'] - Button size
 * @prop {boolean} [disabled=false] - Disables the button when true
 * @prop {boolean} [fullWidth=false] - Makes button expand to container width
 * @prop {() => void} [onClick] - Click handler
 *
 * @accessibility
 * - Uses native `<button>` element for keyboard navigation
 * - Includes visible focus states
 * - Color contrast meets WCAG AA standards
 */
export const Button = ({
  variant = "primary",
  size = "md",
  disabled = false,
  fullWidth = false,
  onClick,
  children,
}: ButtonProps) => {
  // Implementation
};
```

### 5. Utility Functions (in JSDoc)

For shared utility functions, document in the code using JSDoc:

```ts
/**
 * Formats a monetary value based on currency and locale
 *
 * @param value - Amount in cents/smallest currency unit
 * @param currency - Currency code (default: 'USD')
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Formatted currency string
 *
 * @example
 * formatCurrency(1299) // "$12.99"
 * formatCurrency(1299, 'EUR', 'de-DE') // "12,99 €"
 */
export function formatCurrency(
  value: number,
  currency = "USD",
  locale = "en-US",
): string {
  // Implementation...
}
```

### 6. Configuration (in Docusaurus)

Document any project configuration:

- **Environment variables**: Required and optional variables with descriptions
- **Feature flags**: Available feature flags and their effects
- **Build configuration**: Special build steps or configuration options

Example:

```markdown
## Environment Variables

| Variable           | Required | Description                 | Default  |
| ------------------ | -------- | --------------------------- | -------- |
| `MONGODB_URI`      | Yes      | MongoDB connection string   | -        |
| `NEXTAUTH_SECRET`  | Yes      | Secret for NextAuth.js      | -        |
| `NEXTAUTH_URL`     | Yes      | Base URL for auth callbacks | -        |
| `ENABLE_ANALYTICS` | No       | Enable usage analytics      | `false`  |
| `LOG_LEVEL`        | No       | Server logging verbosity    | `"info"` |
```

## Documentation Structure

### Docusaurus Documentation

Documentation in Docusaurus should be stored in the `/docs/docs` directory with the following structure:

```
/docs
  /docs
    /features
      # Feature documentation files
    /models
      # Data model documentation files
    /config
      # Configuration documentation
```

### JSDoc Documentation in Code

For components, API endpoints, and utility functions, use JSDoc comments directly in the code. Follow the examples provided in the sections above.

## PR Requirements

For a PR to be approved and merged:

1. All new features must include documentation in Docusaurus
2. All modified features must have updated documentation in Docusaurus
3. All new or modified Typegoose models must be documented in Docusaurus
4. All new or modified tRPC endpoints must be documented with JSDoc
5. All new or modified components must be documented with JSDoc
6. All new or modified utility functions must be documented with JSDoc
7. All configuration changes including new environment variables must be documented in Docusaurus

## Documentation Review Checklist

Reviewers should ensure documentation:

- [ ] Is in the correct location (Docusaurus or JSDoc)
- [ ] Contains all required sections for the relevant type
- [ ] Includes practical examples
- [ ] Is clear and understandable
- [ ] Is accurate and matches the implementation
- [ ] Has proper formatting
- [ ] Is free of typos and grammatical errors

## Docusaurus Integration

All Docusaurus documentation should use Docusaurus features:

- Use front matter for metadata when appropriate:
  ```markdown
  ---
  title: User Authentication
  description: How to implement and use authentication in the application
  sidebar_position: 3
  ---
  ```
- Use Docusaurus-specific features for better readability:

  ```markdown
  :::note
  This feature requires admin permissions.
  :::

  :::caution
  Remember to validate user input before calling this endpoint.
  :::
  ```

- Group related documentation with appropriate category metadata in `_category_.json` files

## JSDoc Style Guidelines

For JSDoc documentation, follow these guidelines:

- Use consistent tag order (`@component`, `@example`, `@prop`, etc.)
- Include examples for all reusable functions and components
- Document parameters, return values, and thrown exceptions
- Use TypeScript types where possible instead of JSDoc types
- For React components, document props with `@prop` tags
- Add accessibility notes with `@accessibility` for UI components
