// ─────────────────────────────────────────────────────────────
// Viveiros da Gabrieira — Backend de Pagamentos
// Netlify Function: /netlify/functions/create-payment
// ─────────────────────────────────────────────────────────────

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  // Só aceita POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Método não permitido' }) };
  }

  // Cabeçalhos CORS para o browser conseguir comunicar
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  try {
    const body = JSON.parse(event.body);
    const { method, phone, amount, items, customer } = body;

    // Validações básicas
    if (!method || !amount || !items || !customer) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Dados incompletos' }),
      };
    }

    // Valor em cêntimos (Stripe usa sempre cêntimos)
    const amountInCents = Math.round(parseFloat(amount) * 100);

    if (method === 'mb_way') {
      // ── MB WAY ──────────────────────────────────────────────
      if (!phone) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Número de telemóvel obrigatório para MB Way' }),
        };
      }

      // Formatar número: remover espaços e garantir formato +351XXXXXXXXX
      let formattedPhone = phone.replace(/\s/g, '');
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+351' + formattedPhone;
      }

      // Criar PaymentIntent com MB Way
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'eur',
        payment_method_types: ['mb_way'],
        payment_method_data: {
          type: 'mb_way',
          mb_way: {
            phone: formattedPhone,
          },
        },
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
          // status pode ser: 'requires_action' (notificação enviada) ou 'succeeded'
        }),
      };

    } else if (method === 'multibanco') {
      // ── MULTIBANCO ──────────────────────────────────────────
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'eur',
        payment_method_types: ['multibanco'],
        payment_method_data: {
          type: 'multibanco',
          billing_details: {
            name: customer.name,
            email: customer.email,
          },
        },
        confirm: true,
        description: `Viveiros da Gabrieira — ${items.length} produto(s)`,
        metadata: {
          customer_name: customer.name,
          customer_email: customer.email,
          items: JSON.stringify(items.map(i => `${i.name} x${i.qty}`)),
        },
      });

      // A referência Multibanco está nos next_action
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
      body: JSON.stringify({
        error: error.message || 'Erro interno no servidor',
      }),
    };
  }
};
