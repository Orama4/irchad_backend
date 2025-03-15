import { after, before, describe, it } from "node:test";

import { Builder, By, until } from 'selenium-webdriver';
import edge from 'selenium-webdriver/edge.js';
import { expect } from 'chai';


describe('Login Functionality Test', function () {
    let driver:any;

    // Set up the WebDriver before running the tests
    before(async function () {
        driver = await new Builder()
            .forBrowser('MicrosoftEdge')
            .setEdgeOptions(new edge.Options()) 
            .build();
    });

    // Test case: Successful login
    it('se connecter avec réussite ', async function () {
        // Navigate to the login page
        await driver.get('http://localhost:3000/login');

        // Find the email and password input fields and the login button
        const emailInput = await driver.findElement(By.id('email'));
        const passwordInput = await driver.findElement(By.id('password'));
        const loginButton = await driver.findElement(By.id('submitBtn'));

        // Enter valid credentials
        await emailInput.sendKeys('decider@app.com');
        await passwordInput.sendKeys('decider');

        // Click the login button
        await loginButton.click();

        // Wait for the page to redirect and check if login was successful
        await driver.wait(until.urlIs('http://localhost:3000/decider'), 7000);
        const currentUrl = await driver.getCurrentUrl();
        expect(currentUrl).to.equal('http://localhost:3000/decider');
    });

    // Test case: Failed login with invalid credentials
    it('se affiche un erreur Invalid credentials', async function () {
        // Navigate to the login page
        await driver.get('http://localhost:3000/login');

        // Find the email and password input fields and the login button
        const emailInput = await driver.findElement(By.id('email'));
        const passwordInput = await driver.findElement(By.id('password'));
        const loginButton = await driver.findElement(By.id('submitBtn'));

        // Enter invalid credentials
        await emailInput.sendKeys('decider@example.com');
        await passwordInput.sendKeys('wrongpassword');

        // Click the login button
        await loginButton.click();

        const toastElement = await driver.wait(until.elementLocated(By.css('.go3958317564')), 5000);
        const toastText = await toastElement.getText();
        console.log(toastText);
        expect(toastText).to.equal('Invalid credentials');
    });

    // Clean up after the tests
    after(async function () {
        await driver.quit();
    });
});