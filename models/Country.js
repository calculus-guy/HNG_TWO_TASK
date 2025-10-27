const { Sequelize, DataTypes } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  
  process.env.DB_USER,

  process.env.DB_PASSWORD,  
  {
    host: process.env.DB_HOST,
    
    port: process.env.DB_PORT,

    dialect: "mysql",
  }
); 

const Country = sequelize.define("Country", {
  name: { type: DataTypes.STRING, allowNull: false },
  capital: { type: DataTypes.STRING },
  region: { type: DataTypes.STRING },
  population: { type: DataTypes.INTEGER, allowNull: false },
  currency_code: { type: DataTypes.STRING, allowNull: true },
  exchange_rate: { type: DataTypes.FLOAT },
  estimated_gdp: { type: DataTypes.FLOAT },
  flag_url: { type: DataTypes.STRING },
  last_refreshed_at: { type: DataTypes.DATE },
},{
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at', 
}
);

module.exports = { sequelize, Country };