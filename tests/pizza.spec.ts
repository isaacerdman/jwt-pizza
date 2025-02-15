import { test, expect } from "playwright-test-coverage";

test("home page", async ({ page }) => {
  await page.goto("/");

  expect(await page.title()).toBe("JWT Pizza");
});

test("purchase with login", async ({ page }) => {
  await page.route("*/**/api/order/menu", async (route) => {
    const menuRes = [
      {
        id: 1,
        title: "Veggie",
        image: "pizza1.png",
        price: 0.0038,
        description: "A garden of delight",
      },
      {
        id: 2,
        title: "Pepperoni",
        image: "pizza2.png",
        price: 0.0042,
        description: "Spicy treat",
      },
    ];
    expect(route.request().method()).toBe("GET");
    await route.fulfill({ json: menuRes });
  });

  await page.route("*/**/api/franchise", async (route) => {
    const franchiseRes = [
      {
        id: 2,
        name: "LotaPizza",
        stores: [
          { id: 4, name: "Lehi" },
          { id: 5, name: "Springville" },
          { id: 6, name: "American Fork" },
        ],
      },
      { id: 3, name: "PizzaCorp", stores: [{ id: 7, name: "Spanish Fork" }] },
      { id: 4, name: "topSpot", stores: [] },
    ];
    expect(route.request().method()).toBe("GET");
    await route.fulfill({ json: franchiseRes });
  });

  await page.route("*/**/api/auth", async (route) => {
    const loginReq = { email: "d@jwt.com", password: "a" };
    const loginRes = {
      user: {
        id: 3,
        name: "Kai Chen",
        email: "d@jwt.com",
        roles: [{ role: "diner" }],
      },
      token: "abcdef",
    };
    expect(route.request().method()).toBe("PUT");
    expect(route.request().postDataJSON()).toMatchObject(loginReq);
    await route.fulfill({ json: loginRes });
  });

  await page.route("*/**/api/order", async (route) => {
    const orderReq = {
      items: [
        { menuId: 1, description: "Veggie", price: 0.0038 },
        { menuId: 2, description: "Pepperoni", price: 0.0042 },
      ],
      storeId: "4",
      franchiseId: 2,
    };
    const orderRes = {
      order: {
        items: [
          { menuId: 1, description: "Veggie", price: 0.0038 },
          { menuId: 2, description: "Pepperoni", price: 0.0042 },
        ],
        storeId: "4",
        franchiseId: 2,
        id: 23,
      },
      jwt: "eyJpYXQ",
    };
    expect(route.request().method()).toBe("POST");
    expect(route.request().postDataJSON()).toMatchObject(orderReq);
    await route.fulfill({ json: orderRes });
  });

  await page.goto("/");

  // Go to order page
  await page.getByRole("button", { name: "Order now" }).click();

  // Create order
  await expect(page.locator("h2")).toContainText("Awesome is a click away");
  await page.getByRole("combobox").selectOption("4");
  await page.getByRole("link", { name: "Image Description Veggie A" }).click();
  await page.getByRole("link", { name: "Image Description Pepperoni" }).click();
  await expect(page.locator("form")).toContainText("Selected pizzas: 2");
  await page.getByRole("button", { name: "Checkout" }).click();

  // Login
  await page.getByPlaceholder("Email address").click();
  await page.getByPlaceholder("Email address").fill("d@jwt.com");
  await page.getByPlaceholder("Email address").press("Tab");
  await page.getByPlaceholder("Password").fill("a");
  await page.getByRole("button", { name: "Login" }).click();

  // Pay
  await expect(page.getByRole("main")).toContainText(
    "Send me those 2 pizzas right now!"
  );
  await expect(page.locator("tbody")).toContainText("Veggie");
  await expect(page.locator("tbody")).toContainText("Pepperoni");
  await expect(page.locator("tfoot")).toContainText("0.008 ₿");
  await page.getByRole("button", { name: "Pay now" }).click();

  // Check balance
  await expect(page.getByText("0.008")).toBeVisible();
});

test("Login as franchisee and create store", async ({ page }) => {
  await page.route("*/**/api/auth", async (route) => {
    const loginReq = { email: "f@jwt.com", password: "franchisee" };
    const loginRes = {
      user: {
        id: 3,
        name: "pizza franchisee",
        email: "f@jwt.com",
        roles: [{ role: "franchisee" }],
      },
      token: "abcdef",
    };
    // expect(route.request().method()).toBe('PUT');
    // expect(route.request().postDataJSON()).toMatchObject(loginReq);
    await route.fulfill({ json: loginRes });
  });

  await page.route("*/**/api/franchise", async (route) => {
    const franchiseRes = [
      {
        id: 1,
        name: "pizzaPocket",
        admins: [{ id: 3, name: "pizza franchisee", email: "f@jwt.com" }],
        stores: [{ id: 1, name: "SLC", totalRevenue: 0 }],
      },
    ];
    expect(route.request().method()).toBe("GET");
    await route.fulfill({ json: franchiseRes });
  });

  await page.route("*/**/api/franchise/3", async (route) => {
    const franchiseRes = [
      {
        id: 2,
        name: "pizzaPocket",
        admins: [{ id: 4, name: "pizza franchisee", email: "f@jwt.com" }],
        stores: [{ id: 4, name: "SLC", totalRevenue: 0 }],
      },
    ];
    expect(route.request().method()).toBe("GET");
    await route.fulfill({ json: franchiseRes });
  });

  await page.route("*/**/api/franchise/3/store", async (route) => {
    const storeReq = { name: "test", franchiseId: 2 };
    const storeRes = { id: 8, name: "test", totalRevenue: 0 };
    expect(route.request().method()).toBe("POST");
    expect(route.request().postDataJSON()).toMatchObject(storeReq);
    await route.fulfill({ json: storeRes });
  });

  await page.route("*/**/api/franchise/3/store/8", async (route) => {
    expect(route.request().method()).toBe("DELETE");
    await route.fulfill({ json: { message: "store deleted" } });
  });

  await page.goto("http://localhost:5173/");
  await page.getByRole("link", { name: "Login" }).click();
  await page.getByRole("textbox", { name: "Email address" }).fill("f@jwt.com");
  await page.getByRole("textbox", { name: "Password" }).click();
  await page.getByRole("textbox", { name: "Password" }).fill("franchisee");
  await page.getByRole("button", { name: "Login" }).click();
  await page
    .getByRole("contentinfo")
    .getByRole("link", { name: "Franchise" })
    .click();
  await page.getByRole("button", { name: "Create store" }).click();
  await page.getByRole("textbox", { name: "store name" }).click();
  await page.getByRole("textbox", { name: "store name" }).fill("test");
  await page.getByRole("button", { name: "Create" }).click();
  await page.getByRole("link", { name: "Logout" }).click();
});

test("register a user", async ({ page }) => {
  await page.route("*/**/api/auth", async (route) => {
    const registerReq = { email: "test@test.com", password: "test" };
    const registerRes = {
      user: {
        id: 2,
        name: "test",
        email: "test@test.com",
        roles: [{ role: "diner" }],
      },
      token: "tttttt",
    };
    expect(route.request().method()).toBe("POST");
    expect(route.request().postDataJSON()).toMatchObject(registerReq);
    await route.fulfill({ json: registerRes });
  });

  await page.goto("/");
  await page.getByRole("link", { name: "Register" }).click();
  await page.getByRole("textbox", { name: "Full name" }).fill("test");
  await page.getByRole("textbox", { name: "Email address" }).click();
  await page
    .getByRole("textbox", { name: "Email address" })
    .fill("test@test.com");
  await page.getByRole("textbox", { name: "Password" }).click();
  await page.getByRole("textbox", { name: "Password" }).fill("test");
  await page.getByRole("button", { name: "Register" }).click();
});

test("login as diner and view pages", async ({ page }) => {
  await page.route("*/**/api/auth", async (route) => {
    const loginReq = { email: "sam@email.com", password: "sam" };
    const loginRes = {
      user: {
        id: 3,
        name: "sam",
        email: "sam@email.com",
        roles: [{ role: "diner" }],
      },
      token: "abcdef",
    };
    expect(route.request().method()).toBe("PUT");
    expect(route.request().postDataJSON()).toMatchObject(loginReq);
    await route.fulfill({ json: loginRes });
  });

  await page.goto("/");
  await page.getByRole("link", { name: "Login" }).click();
  await page
    .getByRole("textbox", { name: "Email address" })
    .fill("sam@email.com");
  await page.getByRole("textbox", { name: "Email address" }).press("Tab");
  await page.getByRole("textbox", { name: "Password" }).fill("sam");
  await page.getByRole("button", { name: "Login" }).click();
  await page.getByRole("link", { name: "About" }).click();
  await page.getByRole("link", { name: "s", exact: true }).click();
});

test("view admin dashboard and create franchise ", async ({ page }) => {
  await page.route("*/**/api/auth", async (route) => {
    const registerReq = { email: "a@jwt.com", password: "admin" };
    const registerRes = {
      user: {
        id: 1,
        name: "常用名字",
        email: "a@jwt.com",
        roles: [{ role: "admin" }],
      },
      token: "tttttt",
    };
    expect(route.request().method()).toBe("PUT");
    expect(route.request().postDataJSON()).toMatchObject(registerReq);
    await route.fulfill({ json: registerRes });
  });

  await page.goto("http://localhost:5173/");
  await page.getByText("OrderFranchiseLoginRegister").click();
  await page.getByRole("link", { name: "Login" }).click();
  await page.getByRole("textbox", { name: "Email address" }).click();
  await page.getByRole("textbox", { name: "Email address" }).fill("a@jwt.com");
  await page.getByRole("textbox", { name: "Email address" }).press("Tab");
  await page.getByRole("textbox", { name: "Password" }).fill("admin");
  await page.getByRole("button", { name: "Login" }).click();
  await page.getByRole("link", { name: "Admin" }).click();
  await page.getByRole("button", { name: "Add Franchise" }).click();
  await page.getByRole("textbox", { name: "franchise name" }).click();
  await page
    .getByRole("textbox", { name: "franchise name" })
    .fill("testFranchisePlaywrignt");
  await page.getByRole("textbox", { name: "franchisee admin email" }).click();
  await page
    .getByRole("textbox", { name: "franchisee admin email" })
    .fill("sam@email.com");
  await page.getByRole("button", { name: "Create" }).click();
});
