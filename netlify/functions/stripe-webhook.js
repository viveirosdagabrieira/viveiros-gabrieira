const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  const sig = event.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      webhookSecret
    );
  } catch (err) {
    console.error('Webhook inválido:', err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  switch (stripeEvent.type) {
    case 'payment_intent.succeeded': {
      const pi = stripeEvent.data.object;
      console.log('✅ Pagamento confirmado:', pi.id);
      console.log('   Cliente:', pi.metadata.customer_name);
      console.log('   Email:', pi.metadata.customer_email);
      console.log('   Valor:', (pi.amount / 100).toFixed(2) + '€');
      break;
    }
    case 'payment_intent.payment_failed': {
      const pi = stripeEvent.data.object;
      console.log('❌ Pagamento falhado:', pi.id);
      break;
    }
    default:
      console.log('Evento não tratado:', stripeEvent.type);
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
