module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("user", {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },

    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    age: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    height_cm: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },

    weight: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },

    gender: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    activity_level: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    dietary_preference: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "no_preference",
    },

    food_allergies: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    foods_to_avoid: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    cuisine_preference: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    meals_per_day: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    diabetes: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    bp: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    cholesterol: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    thyroid_condition: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    pcos_pcod: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    anemia: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    kidney_disease: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    other_conditions: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    goals: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
  });

  return User;
};