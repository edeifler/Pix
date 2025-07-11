export default function CheckoutTest() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Checkout Test Page</h1>
        <p>Esta é uma página de teste para verificar se o roteamento está funcionando.</p>
        <p>URL atual: {window.location.href}</p>
      </div>
    </div>
  );
}