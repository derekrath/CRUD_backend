const express = require("express");
const app = express();
const morgan = require("morgan");
const cors = require("cors");
const bcrypt = require("bcryptjs");

app.use(morgan("tiny"));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Login Database Connections and Salty Server
const knex = require("./db_controllers/dbConnection");
const {
  createUser,
  getHashedPassword,
} = require("./db_controllers/controllers");
const saltRounds = 12;
const { hash, compare } = bcrypt;

///////////////////
// User Manageemnt
///////////////////

//create user
app.post("/users", async (req, res) => {
  try {
    let { username, rawPassword } = req.body;
    const hashedPassword = await hash(rawPassword, saltRounds);
    const data = await createUser(username, hashedPassword);

    if (data.length > 0) {
      res.status(201).send({ message: "Account created" });
    } else {
      res
        .status(409)
        .send({ message: `Username ${username} is already in use` });
    }
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//get all inventory users
app.get("/users", async (req, res) => {
  try {
    const result = await knex("users").select("*");
    if (result.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//user login
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  getHashedPassword(username)
    .then((hashedPassword) => {
      if (!hashedPassword) {
        return res.status(401).json({ message: "Invalid username" });
      }

      compare(password, hashedPassword)
        .then((isMatch) => {
          if (isMatch) {
            return res.status(200).json({ message: "Login successful" });
          } else {
            return res.status(401).json({ message: "Invalid password" });
          }
        })
        .catch((err) => {
          res.status(500).json({ message: "Error comparing passwords" });
        });
    })
    .catch((err) => {
      res.status(500).json({ message: "Internal server error" });
    });
});

//get user profile
app.get("/users/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    //Validate user ID
    if (isNaN(id) || id < 0) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    //Check user authorization
    if (req.user.id !== id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const userInfo = await knex("users").where("id", id).first();
    if (!userInfo) {
      return res.status(404).json({ message: "User not found" });
    }

    //Remove sensitive hashed password info
    const { hashedPassword, ...sanitizedUserInfo } = userInfo;

    res.status(200).json(sanitizedUserInfo);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//update user profile
app.put("/users/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name } = req.body;

    //Validate user ID
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid id" });
    }

    //Check user authorization
    if (req.user.id !== id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const updatedUserInfo = await knex("users")
      .where("id", id)
      .update({ name })
      .returning("*");

    const { hashedPassword, ...sanitizedUserInfo } = updatedUserInfo[0];

    res.status(200).json(sanitizedUserInfo);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//delete user
app.delete("/users/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Validate ID
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    // Check user authorization
    if (req.user.id !== id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Delete user
    await knex("users").where("id", id).del();

    res.status(200).json({ message: "User account deleted" });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

///////////////////
// Item Inventory Manageemnt
///////////////////

//get all items in inventory
app.get("/items", async (req, res) => {
  try {
    const result = await knex("items").select("*");
    if (result.length === 0) {
      return res.status(404).json({ message: "No items found" });
    }
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//get items for a user
app.get("/items/:user_id", async (req, res) => {
  try {
    let user_id = parseInt(req.params.user_id);

    // Validate user ID
    if (isNaN(user_id) || user_id <= 0) {
      res.status(400).json({ message: "Invalid ID" });
    }

    let result = await knex
      .from("items")
      .innerJoin("users", "items.user_id", "users.id")
      .select("items.id", "items.name", "items.description", "items.quantity")
      .where("items.user_id", user_id);
    if (result.length === 0) {
      res.status(404).json("User has no inventory");
    }
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//add a new item to inventory
app.post("/items", async (req, res) => {
  try {
    const { name, description, quantity } = req.body;
    const user_id = req.user.id;

    //validate user
    const validUser = await knex("users").where("id", user_id).first();
    if (!validUser) {
      return res.status(404).json({ message: "Login required" });
    }

    // validate input data
    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "Invalid entry" });
    }
    if (typeof quantity !== "number" || quantity == null || quantity < 0) {
      return res.status(400).json({ message: "Invalid entry" });
    }

    const newItem = await knex("items")
      .insert({ user_id, name, description, quantity })
      .returning("*");

    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//get specific item in inventory
app.get("/items/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    //Validate item ID
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const item = await knex("items").where("id", id).first();
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//update an item in inventory
app.put("/items/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, description, quantity } = req.body;

    // Validate item ID
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    // Input validation
    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "Invalid name" });
    }
    if (typeof quantity !== "number" || quantity < 0) {
      return res.status(400).json({ message: "Invalid quantity" });
    }

    //Check item exists
    const item = await knex("items").where("id", id).first();
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    //Validate user
    if (req.user.id !== item.user_id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const curentItem = await knex("items").where("id", id).first();
    if (!currentItem) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Update the item
    const updatedItem = await knex("items")
      .where("id", id)
      .update({ name, description, quantity })
      .returning("*");

    res.status(200).json(updatedItem);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//delete an item from inventory
app.delete("/items/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Validate the item ID
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    //Check item exists
    const item = await knex("items").where("id", id).first();
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    //Validate user
    if (req.user.id !== item.user_id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Delete the item
    await knex("items").where("id", id).del();

    res.status(200).json({ message: "Item removed" });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = app;
