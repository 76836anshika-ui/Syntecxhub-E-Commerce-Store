const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-change-this-secret';

const demoProducts = [
  { _id:'p1', name:'Studio Wireless Headphones', category:'Audio', price:129, oldPrice:159, rating:4.8, reviews:248, badge:'BESTSELLER', image:'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85', description:'Rich, detailed sound and all-day comfort.' },
  { _id:'p2', name:'Everyday Carry Backpack', category:'Accessories', price:89, oldPrice:110, rating:4.7, reviews:184, badge:'−19%', image:'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=85', description:'Thoughtfully organized storage for commutes and weekends.' },
  { _id:'p3', name:'Minimal Ceramic Mug Set', category:'Home', price:34, rating:4.9, reviews:96, badge:'NEW', image:'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=900&q=85', description:'A pair of tactile, timeless mugs.' },
  { _id:'p4', name:'Classic Timepiece', category:'Accessories', price:149, oldPrice:179, rating:4.6, reviews:132, image:'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=85', description:'A refined everyday watch with understated details.' },
  { _id:'p5', name:'Everyday Sneakers', category:'Style', price:95, rating:4.8, reviews:211, badge:'POPULAR', image:'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85', description:'Lightweight comfort and a clean profile.' },
  { _id:'p6', name:'Desk Lamp No. 02', category:'Home', price:68, oldPrice:79, rating:4.5, reviews:73, image:'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=85', description:'Warm, focused light for your workspace.' },
  { _id:'p7', name:'Portable Speaker Mini', category:'Audio', price:59, rating:4.7, reviews:157, badge:'NEW', image:'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=900&q=85', description:'Room-filling sound in a compact speaker.' },
  { _id:'p8', name:'Soft Knit Throw', category:'Home', price:52, oldPrice:64, rating:4.9, reviews:88, image:'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=85', description:'A soft, textured layer for your favorite corner.' }
];

let User, Product, Order;
if (process.env.MONGODB_URI) {
  const userSchema = new mongoose.Schema({
    name: { type:String, required:true, trim:true },
    email: { type:String, required:true, unique:true, lowercase:true, trim:true },
    passwordHash: { type:String, required:true },
    role: { type:String, enum:['customer','admin'], default:'customer' }
  }, { timestamps:true });
  const productSchema = new mongoose.Schema({
    name:{type:String,required:true,trim:true}, category:{type:String,default:'Other'},
    price:{type:Number,required:true,min:0}, oldPrice:{type:Number,min:0},
    image:{type:String,default:''}, description:{type:String,default:''},
    rating:{type:Number,default:5}, reviews:{type:Number,default:0}, badge:{type:String,default:''},
    stock:{type:Number,default:20,min:0}
  }, {timestamps:true});
  const orderSchema = new mongoose.Schema({
    user:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},
    items:[{ product:{type:mongoose.Schema.Types.ObjectId,ref:'Product'}, name:String, price:Number, quantity:{type:Number,min:1} }],
    customer:{name:{type:String,required:true},email:{type:String,required:true},address:{type:String,required:true}},
    total:{type:Number,required:true,min:0},
    status:{type:String,enum:['Pending','Processing','Shipped','Delivered','Cancelled'],default:'Pending'}
  }, {timestamps:true});
  User = mongoose.model('User', userSchema);
  Product = mongoose.model('Product', productSchema);
  Order = mongoose.model('Order', orderSchema);
}

function auth(required = true) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token) return required ? res.status(401).json({message:'Login required'}) : next();
    try { req.user = jwt.verify(token, JWT_SECRET); next(); }
    catch { return res.status(401).json({message:'Invalid or expired token'}); }
  };
}
function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({message:'Admin access required'});
  next();
}
function requireDatabase(req, res, next) {
  if (!mongoose.connection.readyState || !User || !Product || !Order)
    return res.status(503).json({message:'MongoDB is not configured. Set MONGODB_URI in backend/.env and restart.'});
  next();
}

app.get('/', (_req,res) => res.json({message:'Syntecxhub E-Commerce API is running', docs:'/api/health'}));
app.get('/api/health', (_req,res) => res.json({status:'ok', database:mongoose.connection.readyState === 1 ? 'connected' : 'demo mode'}));

app.get('/api/products', async (_req,res,next) => {
  try {
    if (Product && mongoose.connection.readyState === 1) {
      const products = await Product.find().sort({createdAt:-1}).lean();
      if (products.length) return res.json(products);
    }
    res.json(demoProducts);
  } catch (e) { next(e); }
});
app.get('/api/products/:id', async (req,res,next) => {
  try {
    if (Product && mongoose.connection.readyState === 1 && mongoose.isValidObjectId(req.params.id)) {
      const p = await Product.findById(req.params.id);
      if (p) return res.json(p);
    }
    const p = demoProducts.find(x => x._id === req.params.id);
    if (!p) return res.status(404).json({message:'Product not found'});
    res.json(p);
  } catch(e) { next(e); }
});

app.post('/api/auth/register', requireDatabase, async (req,res,next) => {
  try {
    const {name,email,password} = req.body || {};
    if (!name || !email || typeof password !== 'string' || password.length < 8)
      return res.status(400).json({message:'Name, email and password (at least 8 characters) are required'});
    const normalizedEmail = String(email).trim().toLowerCase();
    if (await User.findOne({email:normalizedEmail})) return res.status(409).json({message:'Email is already registered'});
    const user = await User.create({name:String(name).trim(),email:normalizedEmail,passwordHash:await bcrypt.hash(password,12)});
    const token = jwt.sign({id:String(user._id),role:user.role},JWT_SECRET,{expiresIn:'2h'});
    res.status(201).json({token,user:{id:user._id,name:user.name,email:user.email,role:user.role}});
  } catch(e) { next(e); }
});
app.post('/api/auth/login', requireDatabase, async (req,res,next) => {
  try {
    const {email,password} = req.body || {};
    const user = await User.findOne({email:String(email || '').trim().toLowerCase()});
    if (!user || typeof password !== 'string' || !await bcrypt.compare(password,user.passwordHash))
      return res.status(401).json({message:'Invalid email or password'});
    const token = jwt.sign({id:String(user._id),role:user.role},JWT_SECRET,{expiresIn:'2h'});
    res.json({token,user:{id:user._id,name:user.name,email:user.email,role:user.role}});
  } catch(e) { next(e); }
});

app.post('/api/orders', auth(), requireDatabase, async (req,res,next) => {
  try {
    const {items,customer} = req.body || {};
    if (!Array.isArray(items) || !items.length || !customer?.name || !customer?.email || !customer?.address)
      return res.status(400).json({message:'Order items and customer details are required'});
    const normalized = [];
    let total = 0;
    for (const item of items) {
      const qty = Number(item.quantity);
      if (!Number.isInteger(qty) || qty < 1 || qty > 99) return res.status(400).json({message:'Invalid quantity'});
      if (!mongoose.isValidObjectId(item.productId)) return res.status(400).json({message:'Invalid product id. Seed products in MongoDB before creating orders.'});
      const p = await Product.findById(item.productId);
      if (!p) return res.status(400).json({message:'Product not found in database'});
      normalized.push({product:p._id,name:p.name,price:p.price,quantity:qty});
      total += p.price * qty;
    }
    const order = await Order.create({user:req.user.id,items:normalized,customer:{name:String(customer.name),email:String(customer.email),address:String(customer.address)},total});
    res.status(201).json({message:'Demo order created. No payment was collected.',order});
  } catch(e) { next(e); }
});
app.get('/api/orders', auth(), requireDatabase, async (req,res,next) => {
  try {
    const orders = req.user.role === 'admin' ? await Order.find().populate('user','name email').sort({createdAt:-1}) : await Order.find({user:req.user.id}).sort({createdAt:-1});
    res.json(orders);
  } catch(e) { next(e); }
});

app.post('/api/admin/products', auth(), requireDatabase, adminOnly, async (req,res,next) => {
  try {
    const {name,category,price,image,description,stock,oldPrice,badge} = req.body || {};
    if (!name || !Number.isFinite(Number(price)) || Number(price) < 0) return res.status(400).json({message:'Product name and a valid non-negative price are required'});
    const product = await Product.create({name,category,price:Number(price),image,description,stock:stock === undefined ? 20 : Number(stock),oldPrice:oldPrice ? Number(oldPrice) : undefined,badge});
    res.status(201).json(product);
  } catch(e) { next(e); }
});
app.patch('/api/admin/products/:id', auth(), requireDatabase, adminOnly, async (req,res,next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({message:'Invalid product id'});
    const allowed = ['name','category','price','oldPrice','image','description','stock','badge'];
    const update = Object.fromEntries(Object.entries(req.body || {}).filter(([k])=>allowed.includes(k)));
    if (update.price !== undefined && (!Number.isFinite(Number(update.price)) || Number(update.price)<0)) return res.status(400).json({message:'Invalid price'});
    const product = await Product.findByIdAndUpdate(req.params.id,update,{new:true,runValidators:true});
    if (!product) return res.status(404).json({message:'Product not found'});
    res.json(product);
  } catch(e) { next(e); }
});
app.delete('/api/admin/products/:id', auth(), requireDatabase, adminOnly, async (req,res,next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({message:'Invalid product id'});
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({message:'Product not found'});
    res.json({message:'Product deleted'});
  } catch(e) { next(e); }
});
app.patch('/api/admin/orders/:id/status', auth(), requireDatabase, adminOnly, async (req,res,next) => {
  try {
    const allowed = ['Pending','Processing','Shipped','Delivered','Cancelled'];
    if (!allowed.includes(req.body?.status)) return res.status(400).json({message:'Invalid order status'});
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({message:'Invalid order id'});
    const order = await Order.findByIdAndUpdate(req.params.id,{status:req.body.status},{new:true,runValidators:true});
    if (!order) return res.status(404).json({message:'Order not found'});
    res.json(order);
  } catch(e) { next(e); }
});

app.use((err,_req,res,_next) => {
  console.error(err);
  if (err.code === 11000) return res.status(409).json({message:'A record with that value already exists'});
  if (err.name === 'ValidationError') return res.status(400).json({message:err.message});
  res.status(500).json({message:'Server error'});
});

async function start() {
  if (process.env.MONGODB_URI) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('MongoDB connected');
    } catch (err) {
      console.error('MongoDB connection failed:', err.message);
      process.exit(1);
    }
  } else {
    console.log('MONGODB_URI is empty; using demo product data. Auth/orders require MongoDB.');
  }
  app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
}
start();
