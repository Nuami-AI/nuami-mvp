import type { ActionStep, ContextCard, ExtractionResult, Phrase, Tip } from "@/types/extraction";
import type { BehaviorStage, ReasonedGuide, StayType } from "./types";

type Lang = "ko" | "en" | "ja" | "vi" | "zh";

function langOf(code: string): Lang {
  if (code.startsWith("en")) return "en";
  if (code.startsWith("ja")) return "ja";
  if (code.startsWith("vi")) return "vi";
  if (code.startsWith("zh")) return "zh";
  return "ko";
}

function step(
  n: number,
  stage: BehaviorStage,
  action: string,
  detail: string,
): ActionStep {
  return { step: n, action, detail, stage };
}

interface Pack {
  summary: string;
  documents: string[];
  whereTo: string[];
  checklist: string[];
  estimatedMinutes: number;
  actions: ActionStep[];
  phrases: Phrase[];
  tips: Tip[];
  contexts: ContextCard[];
}

function bankPack(lang: Lang, stayType: StayType, documents: string[], agencies: string[]): Pack {
  const studentDoc =
    stayType === "D-4"
      ? { ko: "어학당 재학확인서", en: "language school enrollment letter", ja: "語学堂在学確認書", vi: "giấy xác nhận học tiếng", zh: "语言学院在学证明" }
      : { ko: "재학증명서", en: "certificate of enrollment", ja: "在学証明書", vi: "giấy xác nhận sinh viên", zh: "在学证明" };

  const packs: Record<Lang, Pack> = {
    ko: {
      summary: "은행에서 유학생 계좌를 만들려면 서류 확인 후 외국인 창구에서 번호표부터 뽑고 개설·카드 수령까지 한 흐름으로 진행합니다.",
      documents,
      whereTo: agencies,
      checklist: ["외국인등록증과 여권을 함께 챙긴다", `${studentDoc.ko}를 출력한다`, "방문 전 외국인 창구 운영 지점을 확인한다"],
      estimatedMinutes: 60,
      actions: [
        step(1, "prepare", "여권·외국인등록증·재학 증빙을 챙긴다", "창구에서 신원과 유학 자격을 확인합니다."),
        step(2, "move", "외국인 창구가 있는 가까운 지점으로 간다", agencies[0] ?? "가까운 외국인 창구"),
        step(3, "apply", "번호표를 뽑고 계좌 개설 목적을 말한다", "생활비 또는 등록금 수령용이라고 하면 안내가 빠릅니다."),
        step(4, "confirm", "체크카드와 인터넷뱅킹 신청 결과를 확인한다", "비밀번호와 알림 설정을 창구에서 마칩니다."),
      ],
      phrases: [
        { meaning: "계좌를 만들고 싶어요", pronunciation: "계좌 만들고 싶어요", context: "창구 직원에게" },
        { meaning: "외국인등록증이 있어요", pronunciation: "외국인등록증 있어요", context: "서류 제출 시" },
        { meaning: "번호표 뽑는 곳 어디예요?", pronunciation: "번호표 어디예요?", context: "지점 입장 후" },
      ],
      tips: [
        { title: "외국인 창구를 먼저 찾는다", desc: "일반 창구보다 서류 안내가 명확합니다.", cat: "Etiquette" },
        { title: "점심시간 피하기", desc: "12–13시는 대기가 깁니다.", cat: "Time" },
      ],
      contexts: [
        { theme: "한국 은행 창구 순서", explanation: "한국 은행은 목적별로 번호표를 뽑고 호출되면 창구로 갑니다. 외국인은 전용 창구가 있는 지점을 고르면 서류 확인이 수월합니다.", example: "입구 키오스크에서 ‘외국인/외국어’ 또는 일반 번호표를 고른 뒤 대기합니다." },
        { theme: "외국인등록증이 중요한 이유", explanation: "계좌는 실명 확인이 필요해서 여권만으로는 거절되는 지점이 있습니다. 등록증이 있으면 본인 확인이 빨라집니다." },
      ],
    },
    en: {
      summary: "To open a student bank account, prepare your documents, go to a foreigner desk, take a ticket, then finish account opening and card pickup in one visit.",
      documents,
      whereTo: agencies,
      checklist: ["Bring ARC and passport", `Print your ${studentDoc.en}`, "Check a branch with a foreigner desk"],
      estimatedMinutes: 60,
      actions: [
        step(1, "prepare", "Pack passport, ARC, and enrollment proof", "The desk will verify identity and student status."),
        step(2, "move", "Go to a nearby branch with a foreigner desk", agencies[0] ?? "Busan foreigner desk"),
        step(3, "apply", "Take a ticket and say you need a student account", "Mention living expenses or tuition so they route you correctly."),
        step(4, "confirm", "Check your debit card and online banking", "Set PIN and alerts at the counter."),
      ],
      phrases: [
        { meaning: "I want to open an account", pronunciation: "계좌 만들고 싶어요", context: "At the counter" },
        { meaning: "I have an ARC", pronunciation: "외국인등록증 있어요", context: "When submitting documents" },
        { meaning: "Where do I take a ticket?", pronunciation: "번호표 어디예요?", context: "After entering the branch" },
      ],
      tips: [
        { title: "Look for the foreigner desk first", desc: "Document guidance is clearer than at a general window.", cat: "Etiquette" },
        { title: "Avoid lunch hours", desc: "12–1 pm waits are long.", cat: "Time" },
      ],
      contexts: [
        { theme: "How Korean bank counters work", explanation: "You take a numbered ticket by purpose and wait to be called. Branches with a foreigner desk handle student documents faster.", example: "Use the kiosk near the entrance, then sit until your number is shown." },
        { theme: "Why the ARC matters", explanation: "Banks need real-name verification. Some branches refuse passport-only applications." },
      ],
    },
    ja: {
      summary: "留学生口座は書類を揃えて外国人窓口へ行き、整理券を取って開設とカード受け取りまで一度に進めます。",
      documents,
      whereTo: agencies,
      checklist: ["外国人登録証とパスポートを持参", `${studentDoc.ja}を印刷`, "外国人窓口のある支店を確認"],
      estimatedMinutes: 60,
      actions: [
        step(1, "prepare", "パスポート・登録証・在学証明を揃える", "窓口で本人確認と留学資格を確認します。"),
        step(2, "move", "外国人窓口のある近くの支店へ行く", agencies[0] ?? "近くの外国人窓口"),
        step(3, "apply", "整理券を取り、口座開設の目的を伝える", "生活費または授業料受取と伝えると案内が早いです。"),
        step(4, "confirm", "チェックカードとネットバンクを確認する", "暗証番号と通知設定を窓口で完了します。"),
      ],
      phrases: [
        { meaning: "口座を作りたいです", pronunciation: "계좌 만들고 싶어요", context: "窓口で" },
        { meaning: "外国人登録証があります", pronunciation: "외국인등록증 있어요", context: "書類提出時" },
        { meaning: "整理券はどこですか？", pronunciation: "번호표 어디예요?", context: "入店後" },
      ],
      tips: [
        { title: "まず外国人窓口を探す", desc: "一般窓口より書類案内が明確です。", cat: "Etiquette" },
        { title: "昼時を避ける", desc: "12–13時は待ち時間が長いです。", cat: "Time" },
      ],
      contexts: [
        { theme: "韓国の銀行窓口の順番", explanation: "目的別に整理券を取り、呼ばれたら窓口へ行きます。外国人窓口がある支店を選ぶと書類確認がスムーズです。" },
        { theme: "登録証が必要な理由", explanation: "実名確認のため、パスポートだけでは断られる支店があります。" },
      ],
    },
    vi: {
      summary: "Để mở tài khoản sinh viên, chuẩn bị giấy tờ, đến quầy người nước ngoài, lấy số và hoàn tất mở tài khoản cùng thẻ trong một lần.",
      documents,
      whereTo: agencies,
      checklist: ["Mang ARC và hộ chiếu", `In ${studentDoc.vi}`, "Kiểm tra chi nhánh có quầy người nước ngoài"],
      estimatedMinutes: 60,
      actions: [
        step(1, "prepare", "Chuẩn bị hộ chiếu, ARC và giấy xác nhận học", "Quầy sẽ xác minh danh tính và tư cách du học."),
        step(2, "move", "Đến chi nhánh gần nhất có quầy người nước ngoài", agencies[0] ?? "Quầy người nước ngoài tại Busan"),
        step(3, "apply", "Lấy số và nói muốn mở tài khoản", "Nói dùng cho sinh hoạt phí hoặc học phí để được hướng dẫn nhanh."),
        step(4, "confirm", "Kiểm tra thẻ và ngân hàng điện tử", "Đặt PIN và thông báo tại quầy."),
      ],
      phrases: [
        { meaning: "Tôi muốn mở tài khoản", pronunciation: "계좌 만들고 싶어요", context: "Tại quầy" },
        { meaning: "Tôi có thẻ đăng ký người nước ngoài", pronunciation: "외국인등록증 있어요", context: "Khi nộp giấy tờ" },
        { meaning: "Lấy số ở đâu?", pronunciation: "번호표 어디예요?", context: "Sau khi vào ngân hàng" },
      ],
      tips: [
        { title: "Tìm quầy người nước ngoài trước", desc: "Hướng dẫn giấy tờ rõ hơn quầy thường.", cat: "Etiquette" },
        { title: "Tránh giờ ăn trưa", desc: "12–13h chờ rất lâu.", cat: "Time" },
      ],
      contexts: [
        { theme: "Thứ tự quầy ngân hàng Hàn Quốc", explanation: "Bạn lấy số theo mục đích rồi chờ gọi. Chi nhánh có quầy người nước ngoài xử lý hồ sơ sinh viên nhanh hơn." },
        { theme: "Vì sao cần ARC", explanation: "Ngân hàng cần xác minh tên thật. Một số chi nhánh từ chối nếu chỉ có hộ chiếu." },
      ],
    },
    zh: {
      summary: "开设留学生账户时，先备齐材料，前往外国人窗口取号，一次完成开户和领卡。",
      documents,
      whereTo: agencies,
      checklist: ["带上外国人登录证和护照", `打印${studentDoc.zh}`, "确认有外国人窗口的网点"],
      estimatedMinutes: 60,
      actions: [
        step(1, "prepare", "准备护照、登录证和在学证明", "窗口会核对身份和留学资格。"),
        step(2, "move", "前往附近有外国人窗口的网点", agencies[0] ?? "附近外国人窗口"),
        step(3, "apply", "取号并说明要开学生账户", "说明用于生活费或学费到账会更快。"),
        step(4, "confirm", "确认借记卡和网银", "在窗口设置密码和通知。"),
      ],
      phrases: [
        { meaning: "我想开账户", pronunciation: "계좌 만들고 싶어요", context: "在窗口" },
        { meaning: "我有外国人登录证", pronunciation: "외국인등록증 있어요", context: "提交材料时" },
        { meaning: "取号在哪里？", pronunciation: "번호표 어디예요?", context: "进门后" },
      ],
      tips: [
        { title: "先找外国人窗口", desc: "材料说明比普通窗口更清楚。", cat: "Etiquette" },
        { title: "避开午饭时间", desc: "12–13点等待较长。", cat: "Time" },
      ],
      contexts: [
        { theme: "韩国银行窗口顺序", explanation: "按业务取号，叫到号再去窗口。选择有外国人窗口的网点，学生材料核对更快。" },
        { theme: "为什么需要登录证", explanation: "银行需要实名确认，部分网点只凭护照会拒绝开户。" },
      ],
    },
  };
  return packs[lang];
}

function residenceVisitPlaces(agencies: string[]): string[] {
  return agencies.filter(
    (name) =>
      name.trim() &&
      !/하이코리아|hikorea|전자민원|온라인/i.test(name) &&
      !/국제학생|국제처|international\s*(student|office)|유학생\s*지원/i.test(name) &&
      // Generic labels are guidance text, not mappable offices
      !/^새\s*체류지|^관할\s|^체류민원을\s*처리/i.test(name),
  );
}

function residencePack(
  lang: Lang,
  documents: string[],
  agencies: string[],
  opts?: { needAddress?: boolean },
): Pack {
  const visitPlaces = residenceVisitPlaces(agencies);
  const needAddress = Boolean(opts?.needAddress) || visitPlaces.length === 0;
  const visitHint = visitPlaces.slice(0, 3).join(", ");
  const whereTo = needAddress ? [] : visitPlaces;

  const packs: Record<Lang, Pack> = {
    ko: {
      summary: needAddress
        ? "체류지 변경 신고가 필요할 수 있어요. 전입한 날부터 15일 이내 신고해야 합니다. 정확한 관할기관을 찾으려면 새로 이사한 주소나 지역을 알려주세요. 온라인은 HiKorea 전자민원을 이용할 수 있습니다."
        : `이사 후 15일 안에 체류지 변경을 신고하세요. 온라인(HiKorea) 또는 방문(${visitHint})으로 신고한 뒤 처리 결과를 확인합니다.`,
      documents,
      whereTo: whereTo,
      checklist: [
        "전입 날짜를 확인하고 15일 기한을 표시한다",
        "상황에 맞는 체류지 입증서류(계약서·숙소제공확인서·기숙사 증빙 등)를 준비한다",
        "HiKorea(hikorea.go.kr) 온라인 신청 가능 여부를 확인한다",
        needAddress
          ? "새 주소·지역을 알려 관할 방문 기관을 찾는다"
          : "방문 시 관할 행정복지센터·구청·출입국관서 중 선택한다",
      ],
      estimatedMinutes: 90,
      actions: [
        step(
          1,
          "prepare",
          "외국인등록증과 체류지 입증서류를 준비한다",
          "전입한 날부터 15일 이내 신고해야 합니다. 입증서류는 임대차계약서·숙소제공확인서·기숙사 증빙 등 상황에 맞는 공식 서류를 준비하세요.",
        ),
        step(
          2,
          "move",
          "온라인 또는 관할기관 방문 중 신고 방법을 선택한다",
          needAddress
            ? "온라인 신청이 가능하면 HiKorea 전자민원을 이용할 수 있습니다. 방문 관할기관은 새 주소를 알려주시면 안내합니다."
            : `온라인: HiKorea 전자민원. 방문: ${visitHint}. 공항·항만 입국심사장은 제외합니다.`,
        ),
        step(
          3,
          "apply",
          "체류지 변경 신고를 제출한다",
          "새 주소와 체류지 입증서류를 확인해 제출하세요. 온라인은 전자민원 입력, 방문은 창구 제출로 진행합니다.",
        ),
        step(
          4,
          "confirm",
          "변경된 체류지 정보를 확인한다",
          "신고가 정상 처리되었는지 결과를 확인하세요. 온라인·방문에 따라 확인 방법이 다를 수 있습니다.",
        ),
      ],
      phrases: [
        { meaning: "체류지 변경 신고하러 왔어요", pronunciation: "체류지 변경 신고하러 왔어요", context: "관할 창구" },
        { meaning: "여기가 새 주소예요", pronunciation: "새 주소예요", context: "서류 제출 시" },
      ],
      tips: [
        { title: "기한은 15일", desc: "전입한 날부터 계산합니다. 주말이 끼면 미리 신청하세요.", cat: "Time" },
        { title: "과태료", desc: "기한을 넘기면 과태료가 부과될 수 있습니다.", cat: "Other" },
        { title: "학교 ≠ 관할", desc: "대학 인증·국제처는 체류지 신고기관이 아닙니다. 새 주소 관할을 기준으로 하세요.", cat: "Other" },
      ],
      contexts: [
        {
          theme: "왜 체류지 신고가 필요한가",
          explanation:
            "외국인등록 정보는 실제 거주지를 기준으로 관리됩니다. 이사만 하고 신고하지 않으면 공문서와 은행·학교 주소가 어긋납니다.",
          example: "원룸 계약 후 15일 안에 HiKorea 또는 관할 방문 기관에 새 주소를 넣습니다.",
        },
      ],
    },
    en: {
      summary: needAddress
        ? "You may need to report a residence change within 15 days of moving in. Tell us your new address or district so we can find the right office. Online filing via HiKorea may be available."
        : `Report your residence change within 15 days. File online (HiKorea) or visit (${visitHint}), then check the result.`,
      documents,
      whereTo: whereTo,
      checklist: [
        "Confirm move-in date and the 15-day deadline",
        "Prepare proof of residence that fits your case (lease, lodging confirmation, dorm proof, etc.)",
        "Check HiKorea (hikorea.go.kr) for online filing",
        needAddress ? "Share your new address/district for visit offices" : "Choose a local community center, district office, or civil immigration office",
      ],
      estimatedMinutes: 90,
      actions: [
        step(1, "prepare", "Prepare your ARC and proof of residence", "You must report within 15 days of moving in. Use the documents that match your situation under official rules."),
        step(2, "move", "Choose online filing or an in-person visit", needAddress
          ? "If available, use HiKorea e-application. Share your new address to find visit offices."
          : `Online: HiKorea. Visit: ${visitHint}. Airport/port checkpoints are excluded.`),
        step(3, "apply", "Submit the residence change report", "Confirm the new address and proof documents. Online vs visit steps differ."),
        step(4, "confirm", "Confirm the updated residence information", "Check that the report was processed. Confirmation differs for online vs visit."),
      ],
      phrases: [
        { meaning: "I'm here to report my new address", pronunciation: "체류지 변경 신고하러 왔어요", context: "Filing desk" },
        { meaning: "This is my new address", pronunciation: "새 주소예요", context: "When submitting papers" },
      ],
      tips: [
        { title: "15-day deadline", desc: "Count from the day you moved in.", cat: "Time" },
        { title: "Fines", desc: "Missing the deadline can result in a fine.", cat: "Other" },
        { title: "Campus ≠ jurisdiction", desc: "University offices guide you; they are not the filing authority.", cat: "Other" },
      ],
      contexts: [
        { theme: "Why residence reporting matters", explanation: "Your ARC is tied to your actual address. Schools, banks, and mail use this record.", example: "After signing a lease, file within 15 days." },
      ],
    },
    ja: {
      summary: needAddress
        ? "転入日から15日以内に住居地変更の届出が必要です。正確な管轄機関を案内するため、新しい住所や地域を教えてください。HiKorea電子申請も利用できる場合があります。"
        : `転入日から15日以内に住居地変更を届け出ます。オンライン(HiKorea)または訪問(${visitHint})で申請し、結果を確認します。`,
      documents,
      whereTo: whereTo,
      checklist: ["転入日と15日期限を確認", "状況に合う居住地証明書類を準備", "HiKorea電子申請の可否を確認"],
      estimatedMinutes: 90,
      actions: [
        step(1, "prepare", "登録証と居住地証明書類を準備する", "転入日から15日以内に届け出ます。契約書・宿所提供確認書・寮証明など状況に合う公式書類を用意します。"),
        step(2, "move", "オンラインまたは管轄機関訪問を選ぶ", needAddress
          ? "可能な場合はHiKorea電子申請を利用できます。訪問先は新住所を教えてください。"
          : `オンライン: HiKorea。訪問: ${visitHint}。空港・港の審査場は対象外です。`),
        step(3, "apply", "住居地変更を提出する", "新しい住所と証明書類を確認して提出します。"),
        step(4, "confirm", "変更された住居地情報を確認する", "届出が正しく処理されたか結果を確認します。"),
      ],
      phrases: [
        { meaning: "住居地変更の届出に来ました", pronunciation: "체류지 변경 신고하러 왔어요", context: "窓口" },
        { meaning: "新しい住所です", pronunciation: "새 주소예요", context: "書類提出時" },
      ],
      tips: [
        { title: "期限は15日", desc: "転入日から数えます。", cat: "Time" },
        { title: "過料", desc: "期限を過ぎると過料の可能性があります。", cat: "Other" },
      ],
      contexts: [
        { theme: "なぜ届出が必要か", explanation: "外国人登録は実際の居住地で管理されます。" },
      ],
    },
    vi: {
      summary: needAddress
        ? "Bạn có thể cần khai báo thay đổi nơi cư trú trong 15 ngày sau khi chuyển đến. Hãy cho biết địa chỉ/khu vực mới để tìm đúng cơ quan. Có thể nộp online trên HiKorea."
        : `Khai báo thay đổi nơi cư trú trong 15 ngày. Nộp online (HiKorea) hoặc đến (${visitHint}), rồi kiểm tra kết quả.`,
      documents,
      whereTo: whereTo,
      checklist: ["Xác nhận ngày chuyển đến và hạn 15 ngày", "Chuẩn bị giấy chứng minh nơi ở phù hợp tình huống", "Kiểm tra HiKorea nếu nộp online được"],
      estimatedMinutes: 90,
      actions: [
        step(1, "prepare", "Chuẩn bị ARC và giấy chứng minh nơi cư trú", "Phải khai báo trong 15 ngày kể từ ngày chuyển đến. Dùng giấy tờ phù hợp theo quy định chính thức."),
        step(2, "move", "Chọn nộp online hoặc đến cơ quan có thẩm quyền", needAddress
          ? "Nếu được, dùng HiKorea. Cho biết địa chỉ mới để tìm nơi nộp trực tiếp."
          : `Online: HiKorea. Trực tiếp: ${visitHint}. Không dùng cửa khẩu sân bay/cảng.`),
        step(3, "apply", "Nộp khai báo thay đổi nơi cư trú", "Kiểm tra địa chỉ mới và giấy chứng minh rồi nộp."),
        step(4, "confirm", "Xác nhận thông tin nơi cư trú đã đổi", "Kiểm tra kết quả xử lý. Cách xác nhận có thể khác giữa online và trực tiếp."),
      ],
      phrases: [
        { meaning: "Tôi đến khai báo đổi nơi cư trú", pronunciation: "체류지 변경 신고하러 왔어요", context: "Quầy tiếp nhận" },
        { meaning: "Đây là địa chỉ mới", pronunciation: "새 주소예요", context: "Khi nộp giấy" },
      ],
      tips: [
        { title: "Hạn 15 ngày", desc: "Tính từ ngày chuyển đến.", cat: "Time" },
        { title: "Phạt", desc: "Nộp trễ có thể bị phạt hành chính.", cat: "Other" },
      ],
      contexts: [
        { theme: "Vì sao phải khai báo nơi ở", explanation: "Thông tin đăng ký gắn với nơi ở thực tế." },
      ],
    },
    zh: {
      summary: needAddress
        ? "搬入后15日内可能需要申报居留地变更。请告知新地址或地区以便查找管辖机关。也可通过HiKorea网上办理。"
        : `请在搬入后15日内申报居留地变更。可网上(HiKorea)或前往(${visitHint})办理，并确认结果。`,
      documents,
      whereTo: whereTo,
      checklist: ["确认搬入日期与15日期限", "按情况准备居留地证明材料", "确认HiKorea是否可网上申请"],
      estimatedMinutes: 90,
      actions: [
        step(1, "prepare", "准备外国人登录证和居留地证明材料", "须自搬入日起15日内申报。按官方标准准备合同、住宿确认书、宿舍证明等适用材料。"),
        step(2, "move", "选择网上申请或前往管辖机关", needAddress
          ? "如可网上办理，请使用HiKorea。提供新地址后可再案内到访机关。"
          : `网上：HiKorea。到访：${visitHint}。不含机场/港口入境检查设施。`),
        step(3, "apply", "提交居留地变更申报", "核对新地址与证明材料后提交。网上与到访流程不同。"),
        step(4, "confirm", "确认已变更的居留地信息", "确认申报已正常处理。网上与到访的确认方式可能不同。"),
      ],
      phrases: [
        { meaning: "我来申报居留地变更", pronunciation: "체류지 변경 신고하러 왔어요", context: "窗口" },
        { meaning: "这是新地址", pronunciation: "새 주소예요", context: "提交材料时" },
      ],
      tips: [
        { title: "期限15天", desc: "从搬入日开始计算。", cat: "Time" },
        { title: "罚款", desc: "逾期可能被处以罚款。", cat: "Other" },
      ],
      contexts: [
        { theme: "为什么要申报居留地", explanation: "外国人登录以实际住址管理。" },
      ],
    },
  };
  return packs[lang];
}

function hospitalPack(lang: Lang, documents: string[], agencies: string[]): Pack {
  const packs: Record<Lang, Pack> = {
    ko: {
      summary: "병원은 원무과 접수 → 대기 → 진료 → 수납 → 약국 순서입니다. 외국인등록증과 건강보험 자격을 먼저 확인하세요.",
      documents,
      whereTo: agencies,
      checklist: ["건강보험 자격을 앱에서 확인한다", "증상과 약을 메모한다", "응급이 아니면 동네 의원을 먼저 간다"],
      estimatedMinutes: 75,
      actions: [
        step(1, "prepare", "등록증·건강보험 자격·증상 메모를 챙긴다", "접수 창구에서 자격 확인이 빠릅니다."),
        step(2, "move", "가까운 의원 또는 대학병원 국제진료센터로 간다", agencies[0] ?? "동네 의원 원무과"),
        step(3, "apply", "원무과에서 접수하고 진료를 받는다", "이름 호출 후 진료실로 들어갑니다."),
        step(4, "confirm", "수납 후 처방전을 약국에서 조제한다", "약 복용 시간과 다음 예약을 확인합니다."),
      ],
      phrases: [
        { meaning: "접수를 하고 싶어요", pronunciation: "접수해주세요", context: "원무과" },
        { meaning: "여기가 아파요", pronunciation: "여기가 아파요", context: "진료실" },
        { meaning: "건강보험 있어요", pronunciation: "건강보험 있어요", context: "접수 시" },
      ],
      tips: [
        { title: "먼저 동네 의원", desc: "가벼운 증상은 대학병원보다 의원이 대기와 비용이 적습니다.", cat: "Price" },
        { title: "약국은 병원 근처", desc: "처방전은 당일 근처 약국에서 조제합니다.", cat: "Other" },
      ],
      contexts: [
        { theme: "한국 병원 이용 순서", explanation: "한국은 접수와 수납이 진료와 분리되어 있습니다. 원무과를 거치지 않으면 진료실에 들어갈 수 없습니다.", example: "도착 → 원무과 → 대기 → 진료 → 수납 → 약국" },
      ],
    },
    en: {
      summary: "Clinics follow reception → wait → consult → pay → pharmacy. Bring your ARC and health insurance proof.",
      documents,
      whereTo: agencies,
      checklist: ["Check NHIS eligibility in the app", "Note your symptoms", "Start with a local clinic unless it is an emergency"],
      estimatedMinutes: 75,
      actions: [
        step(1, "prepare", "Bring ARC, insurance proof, and a symptom note", "Reception checks eligibility first."),
        step(2, "move", "Go to a nearby clinic or a university international clinic", agencies[0] ?? "local clinic reception"),
        step(3, "apply", "Register at reception and see the doctor", "Enter the room when your name is called."),
        step(4, "confirm", "Pay, then fill the prescription at a pharmacy", "Check dosage times and any follow-up."),
      ],
      phrases: [
        { meaning: "I'd like to register", pronunciation: "접수해주세요", context: "Reception" },
        { meaning: "It hurts here", pronunciation: "여기가 아파요", context: "Exam room" },
        { meaning: "I have health insurance", pronunciation: "건강보험 있어요", context: "At check-in" },
      ],
      tips: [
        { title: "Start with a neighborhood clinic", desc: "For mild symptoms, waits and costs are lower than a university hospital.", cat: "Price" },
        { title: "Pharmacy is next door", desc: "Fill the prescription the same day nearby.", cat: "Other" },
      ],
      contexts: [
        { theme: "Korean clinic flow", explanation: "Reception and payment are separate from the exam. You cannot skip 원무과.", example: "Arrive → reception → wait → consult → pay → pharmacy" },
      ],
    },
    ja: {
      summary: "病院は受付→待ち→診療→会計→薬局の順です。登録証と健康保険資格を先に確認します。",
      documents,
      whereTo: agencies,
      checklist: ["健康保険資格をアプリで確認", "症状をメモ", "救急でなければ近所の医院へ"],
      estimatedMinutes: 75,
      actions: [
        step(1, "prepare", "登録証・保険資格・症状メモを持つ", "受付で資格確認が早くなります。"),
        step(2, "move", "近所の医院または大学病院国際診療へ", agencies[0] ?? "医院の受付"),
        step(3, "apply", "受付して診療を受ける", "名前が呼ばれたら診療室へ。"),
        step(4, "confirm", "会計後、処方箋を薬局で出す", "服用時間と次回予約を確認します。"),
      ],
      phrases: [
        { meaning: "受付をお願いします", pronunciation: "접수해주세요", context: "受付" },
        { meaning: "ここが痛いです", pronunciation: "여기가 아파요", context: "診療室" },
        { meaning: "健康保険があります", pronunciation: "건강보험 있어요", context: "受付時" },
      ],
      tips: [
        { title: "まず近所の医院", desc: "軽い症状は大学病院より待ちと費用が少ないです。", cat: "Price" },
        { title: "薬局は病院の近く", desc: "処方箋はその日のうちに近くで調剤します。", cat: "Other" },
      ],
      contexts: [
        { theme: "韓国の病院の流れ", explanation: "受付と会計が診療と分かれています。원무과を通らないと診療室に入れません。" },
      ],
    },
    vi: {
      summary: "Bệnh viện theo thứ tự tiếp nhận → chờ → khám → thanh toán → nhà thuốc. Mang ARC và bảo hiểm y tế.",
      documents,
      whereTo: agencies,
      checklist: ["Kiểm tra bảo hiểm trên app", "Ghi triệu chứng", "Không cấp cứu thì đến phòng khám gần nhà trước"],
      estimatedMinutes: 75,
      actions: [
        step(1, "prepare", "Mang ARC, bảo hiểm và ghi chú triệu chứng", "Quầy tiếp nhận kiểm tra tư cách trước."),
        step(2, "move", "Đến phòng khám gần hoặc trung tâm quốc tế bệnh viện đại học", agencies[0] ?? "quầy tiếp nhận"),
        step(3, "apply", "Đăng ký tại quầy rồi khám", "Vào phòng khi gọi tên."),
        step(4, "confirm", "Thanh toán rồi lấy thuốc theo đơn", "Kiểm tra giờ uống và lịch tái khám."),
      ],
      phrases: [
        { meaning: "Tôi muốn đăng ký khám", pronunciation: "접수해주세요", context: "Quầy tiếp nhận" },
        { meaning: "Chỗ này đau", pronunciation: "여기가 아파요", context: "Phòng khám" },
        { meaning: "Tôi có bảo hiểm y tế", pronunciation: "건강보험 있어요", context: "Khi đăng ký" },
      ],
      tips: [
        { title: "Ưu tiên phòng khám gần nhà", desc: "Triệu chứng nhẹ thì chờ và chi phí thấp hơn bệnh viện đại học.", cat: "Price" },
        { title: "Nhà thuốc cạnh bệnh viện", desc: "Lấy thuốc trong ngày ở nhà thuốc gần đó.", cat: "Other" },
      ],
      contexts: [
        { theme: "Quy trình bệnh viện Hàn Quốc", explanation: "Tiếp nhận và thanh toán tách khỏi phòng khám. Không qua 원무과 thì không vào được phòng bác sĩ." },
      ],
    },
    zh: {
      summary: "医院流程是挂号接待→等候→就诊→缴费→药店。请先准备登录证和医保资格。",
      documents,
      whereTo: agencies,
      checklist: ["在 App 中确认医保资格", "记下症状", "非急诊先去社区诊所"],
      estimatedMinutes: 75,
      actions: [
        step(1, "prepare", "带上登录证、医保证明和症状备注", "接待窗口会先核对资格。"),
        step(2, "move", "前往附近诊所或大学医院国际诊疗中心", agencies[0] ?? "诊所接待处"),
        step(3, "apply", "在原务科挂号后就诊", "叫到名字再进诊室。"),
        step(4, "confirm", "缴费后到药店取药", "确认服药时间和复诊。"),
      ],
      phrases: [
        { meaning: "我要挂号", pronunciation: "접수해주세요", context: "接待处" },
        { meaning: "这里痛", pronunciation: "여기가 아파요", context: "诊室" },
        { meaning: "我有医保", pronunciation: "건강보험 있어요", context: "挂号时" },
      ],
      tips: [
        { title: "先去附近诊所", desc: "轻症比大学医院等待短、费用低。", cat: "Price" },
        { title: "药店就在医院旁", desc: "当天在附近药店配药。", cat: "Other" },
      ],
      contexts: [
        { theme: "韩国医院流程", explanation: "挂号缴费与就诊分开。不经过원무과无法进入诊室。" },
      ],
    },
  };
  return packs[lang];
}

export function buildVerifiedTemplate(
  reasoned: ReasonedGuide,
  input: { situation: string; userLanguage: string; needAddressPrompt?: string },
): ExtractionResult | null {
  if (!reasoned.scenario) return null;
  const lang = langOf(input.userLanguage);
  const documents = reasoned.documents;
  const agencies = reasoned.agencies;

  const pack =
    reasoned.scenario.id === "bank-account"
      ? bankPack(lang, reasoned.stayType, documents, agencies)
      : reasoned.scenario.id === "residence-change"
        ? residencePack(lang, documents, agencies, {
            needAddress: Boolean(input.needAddressPrompt),
          })
        : hospitalPack(lang, documents, agencies);

  return {
    video: {
      title: input.situation,
      channel: "NUAMI",
      language: lang,
      destinationCountry: "KR",
      destinationLanguage: "ko",
      userLanguage: input.userLanguage,
    },
    situation: {
      summary: pack.summary,
      documents: pack.documents,
      whereTo: pack.whereTo,
      checklist: pack.checklist,
      estimatedMinutes: pack.estimatedMinutes,
    },
    actions: pack.actions,
    places: [],
    phrases: pack.phrases,
    tips: pack.tips,
    contexts: pack.contexts,
    products: [],
  };
}
