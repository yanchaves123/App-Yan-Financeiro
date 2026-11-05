# Security Specification for Yan Financeiro

## 1. Data Invariants
- An account belongs to a user and has valid balance and name.
- A category has a valid name, type (income, expense_personal, expense_professional).
- A credit card has valid billing cycle days (1-31) and limit.
- A client has a name and belongs to a user.
- A project references a valid client and has non-negative monetary amounts.
- A transaction has a valid non-negative amount, type, date, and category.
- A recurring item has a valid periodicity, dueDay (1-31), and amount.
- Settings store reminder times and preferences.

## 2. Access Model
The application provides real-time multi-device synchronization across browsers (Safari on iOS mobile, desktop browsers, tablets) for the Yan Financeiro app.
Documents are accessible for read and write with field shape and size constraints to prevent resource poisoning attacks and invalid data.

## 3. Protected Collections
- `users`
- `accounts`
- `categories`
- `creditCards`
- `clients`
- `projects`
- `transactions`
- `recurring`
- `goals`
- `notifications`
- `settings`
- `test`
