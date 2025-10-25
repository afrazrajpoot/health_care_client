export default function CancelPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center">
      <h1 className="text-3xl font-bold text-red-500">❌ Payment Canceled</h1>
      <p className="mt-4 text-gray-600">Your payment was not completed.</p>
    </div>
  );
}
