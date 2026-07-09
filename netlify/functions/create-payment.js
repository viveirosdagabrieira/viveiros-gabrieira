const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Método não permitido' }) };
  }

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  // Tratar preflight CORS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const body = JSON.parse(event.body);
    const { method, phone, amount, items, customer } = body;

    if (!method || !amount || !items || !customer) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Dados incompletos' }),
      };
    }

    const amountInCents = Math.round(parseFloat(amount) * 100);

    if (method === 'mb_way') {
      // Formatar número
      let formattedPhone = phone.replace(/\s/g, '');
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+351' + formattedPhone;
      }

      // Passo 1: Criar o PaymentMethod MB Way com o número de telemóvel
      const paymentMethod = await stripe.paymentMethods.create({
        type: 'mb_way',
        mb_way: {
          phone: formattedPhone,
        },
      });

      // Passo 2: Criar o PaymentIntent e confirmar com o PaymentMethod
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'eur',
        payment_method_types: ['mb_way'],
        payment_method: paymentMethod.id,
        confirm: true,
        description: `Viveiros da Gabrieira — ${items.length} produto(s)`,
        metadata: {
          customer_name: customer.name,
          customer_email: customer.email,
          items: JSON.stringify(items.map(i => `${i.name} x${i.qty}`)),
        },
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          method: 'mb_way',
          paymentIntentId: paymentIntent.id,
          status: paymentIntent.status,
        }),
      };

    } else if (method === 'multibanco') {

      // Passo 1: Criar o PaymentMethod Multibanco
      const paymentMethod = await stripe.paymentMethods.create({
        type: 'multibanco',
        billing_details: {
          name: customer.name,
          email: customer.email,
        },
      });

      // Passo 2: Criar o PaymentIntent e confirmar
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'eur',
        payment_method_types: ['multibanco'],
        payment_method: paymentMethod.id,
        confirm: true,
        description: `Viveiros da Gabrieira — ${items.length} produto(s)`,
        metadata: {
          customer_name: customer.name,
          customer_email: customer.email,
          items: JSON.stringify(items.map(i => `${i.name} x${i.qty}`)),
        },
      });

      const mbDetails = paymentIntent.next_action?.display_multibanco_details;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          method: 'multibanco',
          paymentIntentId: paymentIntent.id,
          entity: mbDetails?.entity || '21259',
          reference: mbDetails?.reference || '000 000 000',
          amount: (amountInCents / 100).toFixed(2),
          expires: mbDetails?.expires_at
            ? new Date(mbDetails.expires_at * 1000).toLocaleDateString('pt-PT')
            : '72 horas',
        }),
      };

    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Método de pagamento inválido' }),
      };
    }

  } catch (error) {
    console.error('Erro Stripe:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || 'Erro interno no servidor' }),
    };
  }
};
