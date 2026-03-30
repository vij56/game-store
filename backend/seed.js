const mongoose = require("mongoose");
require("dotenv").config();
const Game = require("./models/Game");

mongoose.connect(process.env.MONGO_URI);

const games = [
  {
    title: "musa g",
    price: 3999,
    salePrice: 1999,
    image: "https://wallpapercave.com/uwp/uwp5002449.webp",
    description: "open world fighting game",
  },
  {
    title: "Pubg",
    price: 4799,
    salePrice: 499,
    image: "https://wallpapercave.com/uwp/uwp4990869.jpeg",
    description: "fun game.",
  },
  {
    title: "Madman",
    price: 4300,
    salePrice: 499,
    image: "https://wallpapercave.com/uwp/uwp4991777.jpeg",
    description: "very crazy game",
  },
  {
    title: "Cyberpunk",
    price: 3999,
    salePrice: 299,
    image: "https://wallpapercave.com/uwp/uwp4983998.jpeg",
    description: "realistic graphics game",
  },
  {
    title: "RE9",
    price: 4799,
    salePrice: 499,
    image: "https://wallpapercave.com/uwp/uwp4994393.png",
    description: "horror game.",
  },
  {
    title: "Crimson Desert",
    price: 4300,
    salePrice: 499,
    image: "https://wallpapercave.com/uwp/uwp4991064.jpeg",
    description: "open world fantasyy game",
  },
];

const importData = async () => {
  try {
    await Game.deleteMany();
    await Game.insertMany(games);

    console.log("Data seeded");
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

importData();
