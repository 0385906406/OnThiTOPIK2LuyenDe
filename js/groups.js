// Dạng bài TOPIK II theo số câu (cấu trúc đề chính thức, cố định qua các kỳ).
// Mỗi dạng có hướng dẫn tiếng Hàn, bản dịch, nhóm kỹ năng và mẹo làm bài.

export const READING_GROUPS = [
  { id: 'r-gram-fill', from: 1, to: 2, skill: 'Ngữ pháp',
    ko: '(   )에 들어갈 말로 가장 알맞은 것을 고르십시오.',
    vi: 'Chọn từ/ngữ pháp phù hợp nhất điền vào chỗ trống.',
    tip: 'Xác định quan hệ giữa hai vế câu trước (nguyên nhân, mục đích, điều kiện, lo ngại…), rồi mới nhìn đáp án. Chú ý thì của vế sau: vế sau là quá khứ thì các đuôi như -(으)ㄹ까 봐, -느라고, -는 바람에 hay xuất hiện.' },
  { id: 'r-gram-same', from: 3, to: 4, skill: 'Ngữ pháp',
    ko: '밑줄 친 부분과 의미가 가장 비슷한 것을 고르십시오.',
    vi: 'Chọn cách diễn đạt có nghĩa gần nhất với phần gạch chân.',
    tip: 'Dịch phần gạch chân thành một "chức năng" (ví dụ: phỏng đoán, hối tiếc, ý định), rồi tìm đáp án có cùng chức năng. Học theo cặp đồng nghĩa: -는 바람에 ≈ -는 탓에, -(으)ㄹ 뻔하다 ≈ -(으)ㄹ 수도 있었다…' },
  { id: 'r-topic-ad', from: 5, to: 8, skill: 'Đọc thông tin ngắn',
    ko: '다음은 무엇에 대한 글인지 고르십시오.',
    vi: 'Đoạn quảng cáo/thông báo sau nói về điều gì?',
    tip: 'Gạch từ khóa danh từ trong quảng cáo (sản phẩm, địa điểm, đối tượng). Câu 8 thường hỏi mục đích: 안내, 주의 사항, 사용 방법, 문의…' },
  { id: 'r-match-short', from: 9, to: 12, skill: 'Đọc thông tin ngắn',
    ko: '다음 글 또는 그래프의 내용과 같은 것을 고르십시오.',
    vi: 'Chọn nội dung giống với bài đọc hoặc biểu đồ.',
    tip: 'Đối chiếu từng đáp án với văn bản, đánh dấu chi tiết sai (số liệu, thời gian, chủ thể). Với biểu đồ, chú ý các từ so sánh: 가장, 보다, 증가, 감소, 절반.' },
  { id: 'r-order', from: 13, to: 15, skill: 'Sắp xếp câu',
    ko: '다음을 순서에 맞게 배열한 것을 고르십시오.',
    vi: 'Chọn thứ tự sắp xếp đúng của các câu.',
    tip: 'Câu mở đầu thường nêu chủ đề chung, không có từ nối hay đại từ chỉ định. Câu bắt đầu bằng 그래서, 그러나, 이, 그, 이때, 또한 không thể đứng đầu. Chỉ cần xét 2 lựa chọn câu đầu trong đáp án.' },
  { id: 'r-blank-short', from: 16, to: 18, skill: 'Điền vào chỗ trống',
    ko: '(   )에 들어갈 내용으로 가장 알맞은 것을 고르십시오.',
    vi: 'Chọn nội dung phù hợp nhất điền vào chỗ trống.',
    tip: 'Đọc kỹ câu ngay trước và sau ngoặc. Câu sau thường giải thích hoặc là hệ quả của nội dung trong ngoặc.' },
  { id: 'r-passage', from: 19, to: 24, skill: 'Đọc hiểu đoạn văn',
    ko: '다음을 읽고 물음에 답하십시오.',
    vi: 'Đọc và trả lời câu hỏi.',
    tip: 'Đọc câu hỏi trước. Dạng điền từ nối (그런데, 오히려, 게다가…), thành ngữ (관용어), tâm trạng nhân vật và nội dung giống. Với tâm trạng, tìm câu nói/hành động cụ thể của nhân vật.' },
  { id: 'r-headline', from: 25, to: 27, skill: 'Tiêu đề báo',
    ko: '다음 신문 기사의 제목을 가장 잘 설명한 것을 고르십시오.',
    vi: 'Chọn câu giải thích đúng nhất tiêu đề bài báo.',
    tip: 'Tiêu đề báo lược trợ từ và dùng từ Hán Hàn, ẩn dụ: 껑충 (tăng vọt), 뚝 (giảm mạnh), 주춤 (chững lại), 활짝 (rộng mở), 비상 (khẩn cấp), 몸살 (khốn đốn). Tách tiêu đề thành 2 vế và kiểm tra cả hai vế trong đáp án.' },
  { id: 'r-blank-long', from: 28, to: 31, skill: 'Điền vào chỗ trống',
    ko: '(   )에 들어갈 내용으로 가장 알맞은 것을 고르십시오.',
    vi: 'Chọn nội dung phù hợp nhất điền vào chỗ trống.',
    tip: 'Tìm từ chỉ hướng logic quanh ngoặc: 따라서/그래서 (kết luận), 그러나/하지만 (đối lập), 즉 (diễn giải lại). Đáp án đúng thường diễn đạt lại ý đã có trong bài bằng từ khác.' },
  { id: 'r-match-long', from: 32, to: 34, skill: 'Đọc hiểu đoạn văn',
    ko: '다음을 읽고 내용이 같은 것을 고르십시오.',
    vi: 'Chọn nội dung giống với bài đọc.',
    tip: 'Đáp án sai thường đổi chủ thể, phóng đại (항상, 모두, 반드시) hoặc đảo quan hệ nhân quả. Loại trừ từng đáp án bằng bằng chứng trong bài.' },
  { id: 'r-theme', from: 35, to: 38, skill: 'Chủ đề',
    ko: '다음 글의 주제로 가장 알맞은 것을 고르십시오.',
    vi: 'Chọn chủ đề phù hợp nhất của bài.',
    tip: 'Chủ đề thường nằm ở câu cuối hoặc sau 그러므로, 따라서, 결국, -아/어야 한다. Đáp án chỉ nói về một chi tiết thì không phải chủ đề.' },
  { id: 'r-insert', from: 39, to: 41, skill: 'Vị trí câu',
    ko: '주어진 문장이 들어갈 곳으로 가장 알맞은 것을 고르십시오.',
    vi: 'Chọn vị trí thích hợp nhất để chèn câu cho sẵn.',
    tip: 'Phân tích câu cho sẵn: nó có từ nối hay đại từ chỉ định (이러한, 그 결과, 이 때문에) không? Câu đó phải đứng ngay sau câu mà nó tham chiếu tới.' },
  { id: 'r-literature', from: 42, to: 43, skill: 'Văn học',
    ko: '다음을 읽고 물음에 답하십시오.',
    vi: 'Đọc trích đoạn văn học và trả lời.',
    tip: 'Câu 42 hỏi tâm trạng/thái độ nhân vật ở phần gạch chân. Học nhóm từ cảm xúc: 서운하다, 원망스럽다, 안타깝다, 담담하다, 걱정스럽다, 부끄럽다, 후련하다.' },
  { id: 'r-advanced', from: 44, to: 50, skill: 'Đọc hiểu đoạn văn',
    ko: '다음을 읽고 물음에 답하십시오.',
    vi: 'Đọc bài dài và trả lời câu hỏi.',
    tip: 'Các câu hỏi: chủ đề, điền chỗ trống, mục đích viết (목적), thái độ tác giả (태도), vị trí câu, nội dung giống. Thái độ: 우려 (lo ngại), 비판 (phê phán), 강조 (nhấn mạnh), 기대 (kỳ vọng), 촉구 (kêu gọi).' },
];

export const LISTEN_GROUPS = [
  { id: 'l-picture', from: 1, to: 3, skill: 'Tranh & biểu đồ',
    ko: '다음을 듣고 가장 알맞은 그림 또는 그래프를 고르십시오.',
    vi: 'Nghe và chọn tranh hoặc biểu đồ phù hợp nhất.',
    tip: 'Xem trước các tranh, đoán địa điểm và hành động. Với biểu đồ, nghe chủ đề (조사 대상) và xu hướng (증가, 감소, 가장 많은).' },
  { id: 'l-next-line', from: 4, to: 8, skill: 'Câu nói tiếp theo',
    ko: '다음을 듣고 이어질 수 있는 말로 가장 알맞은 것을 고르십시오.',
    vi: 'Nghe và chọn câu nói tiếp theo phù hợp nhất.',
    tip: 'Tập trung vào câu cuối của đoạn hội thoại: đó là câu hỏi, đề nghị hay lời than phiền? Đáp án đúng phải phản hồi trực tiếp câu đó.' },
  { id: 'l-next-act', from: 9, to: 12, skill: 'Hành động tiếp theo',
    ko: '다음을 듣고 여자가 이어서 할 행동으로 가장 알맞은 것을 고르십시오.',
    vi: 'Nghe và chọn hành động tiếp theo của người phụ nữ.',
    tip: 'Nghe kỹ phần cuối: -(으)ㄹ게요, -아/어 줄래요?, 그럼 제가… Nhiều đáp án là việc đã làm hoặc việc người kia sẽ làm.' },
  { id: 'l-match', from: 13, to: 16, skill: 'Nội dung giống',
    ko: '다음을 듣고 들은 내용과 같은 것을 고르십시오.',
    vi: 'Nghe và chọn nội dung giống với bài nghe.',
    tip: 'Đọc trước 4 đáp án, gạch từ khóa khác nhau giữa chúng. Khi nghe, loại dần đáp án sai chủ thể, sai thời gian.' },
  { id: 'l-main-idea', from: 17, to: 20, skill: 'Suy nghĩ chính',
    ko: '다음을 듣고 남자의 중심 생각으로 가장 알맞은 것을 고르십시오.',
    vi: 'Nghe và chọn suy nghĩ chính của người đàn ông.',
    tip: 'Ý chính thường nằm ở câu kết của người đàn ông, sau các cụm như -아/어야 해요, -는 게 좋을 것 같아요, 제 생각에는. Đáp án đúng có tính khái quát.' },
  { id: 'l-dialogue', from: 21, to: 34, skill: 'Hội thoại & bài nói',
    ko: '다음을 듣고 물음에 답하십시오.',
    vi: 'Nghe và trả lời câu hỏi.',
    tip: 'Mỗi bài nghe có 2 câu hỏi: đọc cả hai trước khi nghe. Câu hỏi thường gặp: ý chính, mục đích, người nói là ai, nội dung giống.' },
  { id: 'l-lecture', from: 35, to: 50, skill: 'Bài giảng & thảo luận',
    ko: '다음을 듣고 물음에 답하십시오.',
    vi: 'Nghe bài giảng, phỏng vấn, tranh luận và trả lời câu hỏi.',
    tip: 'Phần khó nhất. Ghi chú theo khung: chủ đề → lập luận → ví dụ → kết luận. Câu hỏi thái độ: 분석, 비판, 우려, 촉구, 강조. Câu hỏi "trước đoạn này nói gì" nghe kỹ câu mở đầu.' },
];

export function groupOf(section, n) {
  const list = section === 'listen' ? LISTEN_GROUPS : READING_GROUPS;
  return list.find(g => n >= g.from && n <= g.to) || list[list.length - 1];
}

export function groupsFor(section) {
  return section === 'listen' ? LISTEN_GROUPS : READING_GROUPS;
}

// Nhóm kỹ năng (gộp nhiều dạng bài) để phân tích điểm mạnh/yếu
export function skillsFor(section) {
  const seen = [];
  for (const g of groupsFor(section)) if (!seen.includes(g.skill)) seen.push(g.skill);
  return seen;
}
