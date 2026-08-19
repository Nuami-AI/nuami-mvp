export default function AdminDeniedPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="text-lg font-bold text-gray-900">접근 권한이 없습니다.</p>
        <p className="mt-2 text-sm text-gray-500">이 계정으로 해당 기관 관리자 화면에 들어갈 수 없어요.</p>
        <a href="/admin" className="mt-6 inline-block text-sm font-semibold text-accent-700">
          기관 목록으로
        </a>
      </div>
    </div>
  );
}
