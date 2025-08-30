// cypress/e2e/full-flow.cy.js

describe('Full E-Commerce Flow', () => {
  // --- Dynamic variables for a unique test run every time ---
  const testId = Date.now();
  const sellerEmail = `seller-${testId}@example.com`;
  const storeName = `Cypress Store ${testId}`;
  const storeSlug = `cypress-store-${testId}`; // We'll create the slug manually for predictability
  const password = 'password123';

  // --- 1. Seller Registration and Setup ---
  it('should allow a seller to register, create a category, and create a product', () => {
    // **Part A: Seller Registration**
    cy.visit('/register');
    cy.get('input[placeholder="Full Name"]').type('Cypress Seller');
    cy.get('input[placeholder="Email Address"]').type(sellerEmail);
    cy.get('input[placeholder="Password (min 8 characters)"]').type(password);
    
    // We manually create the store name to get a predictable slug
    cy.get('input[placeholder*="Store Name"]').type(storeName); 
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/login');

    // **Part B: Seller Login**
    cy.get('input[placeholder="Email"]').type(sellerEmail);
    cy.get('input[placeholder="Password"]').type(password);
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/admin');
    cy.contains('h1', 'Admin Dashboard').should('be.visible');

    // **Part C: Create a Category**
    cy.visit('/admin/add-category');
    // For Material UI text fields, it's better to target by label/ID
    cy.get('.MuiTextField-root').contains('label', 'Category Name').next('div').find('input').type('Test Sweets');
    cy.contains('button', 'Add Category').click();
    cy.contains('.MuiSnackbar-root', 'Category added successfully!').should('be.visible');
    cy.contains('td', 'Test Sweets').should('be.visible');

     // **Part D: Create a Product**
    cy.visit('/admin/add-product');
    cy.contains('button', 'Add Product').click();

    cy.get('div[role="dialog"]').within(() => {
        cy.get('input[name="name"]').type('Delicious Laddu');
        cy.get('input[name="slug"]').type('delicious-laddu');  
        cy.get('input[name="pricePerUnit"]').type('15.00');
        cy.get('textarea[name="description"]').type('A fresh sweet made for testing.');
        cy.contains('button', 'Save').click();
    });
    cy.contains('td', 'Delicious Laddu').should('be.visible');
  });

  // --- 2. Customer Purchase Flow ---
  it('should allow a customer to buy the newly created product', () => {
    // **Part A: Visit the new store and find the product**
    cy.visit(`/${storeSlug}`);
    cy.contains('h3', 'Delicious Laddu').should('be.visible');
    cy.contains('button', 'Order Now').click();
    cy.url().should('include', `/${storeSlug}/product/delicious-laddu`);

    // **Part B: Add to cart and checkout**
    cy.contains('button', 'Add to Cart').click();
    cy.get('.cart-count').should('contain', '1');
    cy.get('.cart-icon').click();
    cy.url().should('include', '/cart');

    // **Part C: Fill shipping and place order**
    cy.get('input[name="fullName"]').type('Test Customer');
    cy.get('input[name="phoneNumber"]').type('5551234567');
    cy.get('input[name="streetAddress"]').type('123 Cypress Lane');
    cy.get('input[name="city"]').type('Testburg');
    cy.get('input[name="state"]').type('TS');
    cy.get('input[name="postalCode"]').type('54321');
    cy.contains('button', 'Place Order').click();

    // **Part D: Verify success**
    cy.on('window:alert', (text) => {
      expect(text).to.contain('Order placed successfully!');
    });
    cy.url().should('eq', `${Cypress.config().baseUrl}/${storeSlug}`);
  });
});