import { useEffect } from "react";

export default function CheckoutFinal() {
  const planId = new URLSearchParams(window.location.search).get('plan') || 'professional';
  
  const planInfo = {
    basic: { name: 'Básico', price: 'R$ 49,90', amount: 4990 },
    professional: { name: 'Profissional', price: 'R$ 99,90', amount: 9990 },
    enterprise: { name: 'Premium', price: 'R$ 189,90', amount: 18990 }
  };

  const currentPlan = planInfo[planId as keyof typeof planInfo] || planInfo.professional;

  useEffect(() => {
    // Injetar o script do Stripe
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.onload = () => {
      initializeCheckout();
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup - remover script se necessário
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  const initializeCheckout = async () => {
    try {
      const stripeKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
      if (!stripeKey) {
        document.querySelector("#messages")!.textContent = "Chave do Stripe não configurada";
        return;
      }

      // @ts-ignore - Stripe é carregado dinamicamente
      const stripe = Stripe(stripeKey);
      let elements: any;

      // Buscar clientSecret do servidor
      const response = await fetch('/api/create-payment-intent', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          planId: planId,
          amount: currentPlan.amount
        })
      });
      
      const { clientSecret, error } = await response.json();

      if (error) {
        document.querySelector("#messages")!.textContent = error;
        return;
      }

      if (!clientSecret) {
        document.querySelector("#messages")!.textContent = "Erro: clientSecret não retornado pelo servidor";
        return;
      }

      // Criar elementos do Stripe
      elements = stripe.elements({ 
        appearance: { theme: 'stripe' }, 
        clientSecret 
      });
      
      const paymentElement = elements.create("payment");
      paymentElement.mount("#payment-element");

      // Configurar evento de submit do formulário
      document.querySelector("#payment-form")!.addEventListener("submit", async (e: any) => {
        e.preventDefault();
        
        const submitButton = document.querySelector("#submit-button") as HTMLButtonElement;
        submitButton.disabled = true;
        submitButton.textContent = "Processando...";

        const { error } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/dashboard`,
          },
        });

        if (error) {
          document.querySelector("#messages")!.textContent = error.message;
          submitButton.disabled = false;
          submitButton.textContent = "Pagar Agora";
        }
      });

    } catch (e: any) {
      document.querySelector("#messages")!.textContent = "Erro ao inicializar pagamento: " + e.message;
    }
  };

  return (
    <div dangerouslySetInnerHTML={{
      __html: `
        <!DOCTYPE html>
        <html lang="pt-br">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Checkout PixConcilia</title>
            <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, sans-serif; 
                font-size: 16px; 
                background-color: #f6f9fc; 
                margin: 0;
                padding: 20px;
              }
              #payment-container { 
                max-width: 500px; 
                margin: 50px auto; 
                background: white; 
                padding: 25px; 
                border-radius: 8px; 
                box-shadow: 0 4px 6px rgba(50, 50, 93, 0.11), 0 1px 3px rgba(0, 0, 0, 0.08); 
              }
              #payment-element { 
                margin-bottom: 20px; 
              }
              #submit-button { 
                background: #5469d4; 
                color: #ffffff; 
                border: none; 
                padding: 12px 16px; 
                border-radius: 4px; 
                font-weight: 600; 
                cursor: pointer; 
                width: 100%; 
                font-size: 16px; 
                transition: background-color 0.2s; 
              }
              #submit-button:hover { 
                background: #4353a8; 
              }
              #submit-button:disabled { 
                background: #adbeff; 
                cursor: not-allowed; 
              }
              #messages { 
                margin-top: 15px; 
                color: #fa755a; 
              }
              .plan-info {
                background: #f0f9ff;
                border: 1px solid #0ea5e9;
                border-radius: 6px;
                padding: 15px;
                margin-bottom: 20px;
              }
              .security-info {
                text-align: center;
                margin-top: 20px;
                padding-top: 15px;
                border-top: 1px solid #e2e8f0;
                font-size: 14px;
                color: #64748b;
              }
            </style>
        </head>
        <body>
            <div id="payment-container">
                <h2 style="text-align: center; color: #1e293b; margin-bottom: 10px;">PixConcilia</h2>
                <div class="plan-info">
                  <h3 style="margin: 0 0 5px 0;">${currentPlan.name}: ${currentPlan.price}/mês</h3>
                  <p style="margin: 0; color: #059669;">✅ 7 dias grátis incluídos</p>
                </div>
                <form id="payment-form">
                    <div id="payment-element">
                        <!-- Stripe Elements será montado aqui -->
                    </div>
                    <button id="submit-button">Pagar Agora</button>
                    <div id="messages" role="alert"></div>
                </form>
                <div class="security-info">
                  <p>💳 Para teste: 4242 4242 4242 4242</p>
                  <p>🔒 SSL Seguro • ✓ Stripe Verified • 🚫 Cancele a qualquer momento</p>
                </div>
            </div>
        </body>
        </html>
      `
    }} />
  );
}