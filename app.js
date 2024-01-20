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
  // getHashedPassword,
  getUserByUsername,
} = require("./db_controllers/controllers");
const saltRounds = 12;
const { hash, compare } = bcrypt;

///////////////////
// User Manageemnt
///////////////////

//create user
app.post("/users", async (req, res) => {
  // app.post('/users', (req, res) => {
  try {
    let { username, password } = req.body;
    const hashedPassword = await hash(password, saltRounds);
    // const hashedPassword = hash(rawPassword, saltRounds);
    const data = await createUser(username, hashedPassword);
    // const data = createUser(username, hashedPassword);
    if (data.length > 0) {
      res.status(201).send({ message: "ACCOUNT CREATED" });
    } else {
      res.status(409).send({ message: `USERNAME ${username} ALREADY EXISTS` });
    }
  } catch (err) {
    res.status(500).json({ message: "INTERNAL SERVER ERROR" });
  }
});

//get all inventory users
app.get("/users", async (req, res) => {
  try {
    const result = await knex("users").select("*");
    if (result.length === 0) {
      return res.status(404).json({ message: "NO USERS FOUND" });
    }
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: "INTERNAL SERVER ERROR" });
  }
});

//user login
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  getUserByUsername(username)
    .then((userInfo) => {
      if (!userInfo) {
        return res.status(401).json({ message: "INVALID USERNAME" });
      }
      //check if password is already hashed
      if (password == userInfo.hashedPassword) {
        // const { hashedPassword, ...sanitizedUserInfo } = userInfo;
        return res.status(200).json({
          // user: sanitizedUserInfo,
          user: userInfo,
          message: "LOGIN SUCCESSFUL",
        });
      } else {
        //if password is not hashed, use bcrypt compare
        let passwordRaw = password;
        compare(passwordRaw, userInfo.hashedPassword)
          .then((isMatch) => {
            if (isMatch) {
              // const { hashedPassword, ...sanitizedUserInfo } = userInfo;
              return res.status(200).json({
                // user: sanitizedUserInfo,
                user: userInfo,
                message: "LOGIN SUCCESSFUL",
              });
            } else {
              return res.status(401).json({ message: "INVALID PASSWORD" });
            }
          })
          .catch((err) => {
            res.status(500).json({ message: "ERROR VALIDATING PASSWORD" });
          });
      }
    })
    .catch((err) => {
      res.status(500).json({ message: "INTERNAL SERVER ERROR" });
    });
});

//get user profile
app.get("/users/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    //Validate user ID
    if (isNaN(id) || id < 0) {
      return res.status(400).json({ message: "INVALID USER ID" });
    }

    //Check user authorization
    if (req.user.id !== id) {
      return res.status(403).json({ message: "UNAUTHORIZED" });
    }

    const userInfo = await knex("users").where("id", id).first();
    if (!userInfo) {
      return res.status(404).json({ message: "USER NOT FOUND" });
    }

    // res.status(200).json(userInfo);
    //Better to remove sensitive hashed password info
    const { hashedPassword, ...sanitizedUserInfo } = userInfo;
    res.status(200).json(sanitizedUserInfo);
  } catch (error) {
    res.status(500).json({ message: "INTERNAL SERVER ERROR" });
  }
});

//update user profile
app.put("/users/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { first_name, last_name } = req.body;

    //Validate user ID
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ message: "INVALID USER ID" });
    }

    //Check user authorization
    if (req.user.id !== id) {
      return res.status(403).json({ message: "UNAUTHORIZED" });
    }

    const updatedUserInfo = await knex("users")
      .where("id", id)
      .update({ first_name, last_name })
      .returning("*");

    const { hashedPassword, ...sanitizedUserInfo } = updatedUserInfo[0];

    res.status(200).json(sanitizedUserInfo);
  } catch (error) {
    res.status(500).json({ message: "INTERNAL SERVER ERROR" });
  }
});

//delete user
app.delete("/users/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    // Delete user
    await knex("users").where({ id }).del();
    res.status(200).json({ message: "USER ACCOUNT DELETED" });
  } catch (error) {
    res.status(500).json({ message: "INTERNAL SERVER ERROR" });
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
    res.status(500).json({ message: "INTERNAL SERVER ERROR" });
  }
});

//get items for a user
app.get("/items/:user_id", async (req, res) => {
  try {
    let user_id = parseInt(req.params.user_id);

    // Validate user ID
    if (isNaN(user_id) || user_id <= 0) {
      res.status(400).json({ message: "INVALID USER ID" });
    }

    let result = await knex
      .from("items")
      .innerJoin("users", "items.user_id", "users.id")
      .select("items.id", "items.name", "items.description", "items.quantity")
      .where("items.user_id", user_id);
    if (result.length === 0) {
      res.status(404).json({ message: "USER HAS NO INVENTORY" });
    }
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: "INTERNAL SERVER ERROR" });
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
      return res.status(404).json({ message: "LOGIN REQUIRED" });
    }

    // validate input data
    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "INVALID ENTRY" });
    }
    if (typeof quantity !== "number" || quantity == null || quantity < 0) {
      return res.status(400).json({ message: "INVALID ENTRY" });
    }

    const newItem = await knex("items")
      .insert({ user_id, name, description, quantity })
      .returning("*");

    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ message: "INTERNAL SERVER ERROR" });
  }
});

//get specific item in inventory
app.get("/items/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    //Validate item ID
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ message: "INVALID USER ID" });
    }

    const item = await knex("items").where("id", id).first();
    if (!item) {
      return res.status(404).json({ message: "ITEM NOT FOUND" });
    }

    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({ message: "INTERNAL SERVER ERROR" });
  }
});

//update an item in inventory
app.put("/items/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, description, quantity } = req.body;

    // Validate item ID
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ message: "INVALID USER ID" });
    }

    // Input validation
    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "INVALID NAME" });
    }
    if (typeof quantity !== "number" || quantity < 0) {
      return res.status(400).json({ message: "INVALID QUANTITY" });
    }

    //Check item exists
    const item = await knex("items").where("id", id).first();
    if (!item) {
      return res.status(404).json({ message: "ITEM NOT FOUND" });
    }

    //Validate user
    if (req.user.id !== item.user_id) {
      return res.status(403).json({ message: "UNAUTHORIZED" });
    }

    const curentItem = await knex("items").where("id", id).first();
    if (!currentItem) {
      return res.status(404).json({ message: "ITEM NOT FOUND" });
    }

    // Update the item
    const updatedItem = await knex("items")
      .where("id", id)
      .update({ name, description, quantity })
      .returning("*");

    res.status(200).json(updatedItem);
  } catch (error) {
    res.status(500).json({ message: "INTERNAL SERVER ERROR" });
  }
});

//delete an item from inventory
app.delete("/items/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Validate the item ID
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ message: "INVALID USER ID" });
    }

    //Check item exists
    const item = await knex("items").where("id", id).first();
    if (!item) {
      return res.status(404).json({ message: "ITEM NOT FOUND" });
    }

    //Validate user
    if (req.user.id !== item.user_id) {
      return res.status(403).json({ message: "UNAUTHORIZED" });
    }

    // Delete the item
    await knex("items").where("id", id).del();

    res.status(200).json({ message: "Item removed" });
  } catch (error) {
    res.status(500).json({ message: "INTERNAL SERVER ERROR" });
  }
});

module.exports = app;

// If wanting to switch to token for authentication:
// const token = jwt.sign(userData, process.env.JWT_SECRET, { expiresIn: '12h' }); // Creates JWT token
// res.status(200).json({ token }); // Send token to the frontend
