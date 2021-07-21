const { User, Product, Order, Order_Product } = require("../../db");

/*Ruta PUT localhost:3001/order/create/update
-Retorna un orderId
-Si no la encuentra devuelve, 'Order is not create ERROR'
-Recibo un body:

body = {
  userId,
//array de uno o varios productos, con id y cantidad
  products:[
      {
          productId,
          quantity
      },
      {
          productId,
          quantity
      },
  ]
}
*/

async function createUpdateOrder(req, res, _next) {
  try {
    const {
      products,
      userId
    } = req.body;
    //Se busca la orden por userId y que sea orderState 'CART'
    const orderExists = await Order.findOne({ where:{
      userId,
      orderState: 'CART',
    }
   });
    //Si la order no existe, se crea y se retorna el orderId
    if (!orderExists) {
      //Crea la orden
      const order = await Order.create({ userId });
      //Busca el usuario por userId
      const user = await User.findByPk(userId);
      //Asocia user a la order
      user.addOrder(order);
      //Recorre los productos que vienen por body
      products.forEach(async product => {
        //Busca el producto por productId
        const productData = await Product.findByPk(product.productId);
        //Asocia product a la order, con la cantidad y el precio (de la DB);
        order.addProduct(productData, {
          through: {
            quantity: product.quantity,
            price: productData.price
          }
        });
      }); 
      return res.json(`Orden creada ID:${order.id}`);
      //Si la orden existe se fusiona
    } else {
      //Array de productos actuales de la orden
      const order_Products = await Order_Product.findAll({ where: { orderId: orderExists.id } });
      //Por cada product que llega
      products.forEach(async product => {
        //Buscamos el producto en la DB
        const productData = await Product.findByPk(product.productId);
        // console.log('productData', productData);
        const productExists = order_Products.find(op => op.productId === product.productId);
        //Si no lo encuentra lo agrega a la orden
        if (!productExists) {
          orderExists.addProduct(productData, {
            through: {
              quantity: product.quantity,
              price: productData.price
            }
          });
          //Si lo encuentra lo actualiza 
        } else {
          // console.log('product.quantity',productData.price)
          await productExists.update({
            quantity: product.quantity,
            price: productData.price
          });
        }
      }); 
    }
    return res.json(`Orden actualizada ID:${orderExists.id}`);
  } catch (err) {
    console.log(err);
    return res.send('Order is not created ERROR');
  }
}
     
   
module.exports = {
  createUpdateOrder,
};
