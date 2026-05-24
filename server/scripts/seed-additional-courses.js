const mysql = require('mysql2/promise');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'pkastudy',
  });

  try {
    console.log('Seeding additional TOEIC courses with multi-lesson structure...');

    const newCourses = [
      {
        slug: 'toeic-very-easy',
        title: 'Very Easy TOEIC Vocabulary',
        description: 'Từ vựng cơ bản dành cho người mới bắt đầu (Mục tiêu dưới 450).',
        sort_order: 2,
        lessons: [
          {
            slug: 'easy-lesson-1',
            title: '📄 Lesson 1: Office Basics',
            description: 'Từ vựng cơ bản về văn phòng và giao tiếp công sở.',
            sort_order: 1,
            words: [
              { word: 'contract', transcription: "/'kɒntrækt/", word_type: 'n.', meaning: 'hợp đồng', example: 'They signed a contract yesterday.', example_vi: 'Họ đã ký một hợp đồng vào hôm qua.' },
              { word: 'establish', transcription: "/ɪ'stæblɪʃ/", word_type: 'v.', meaning: 'thiết lập, thành lập', example: 'The company was established in 2010.', example_vi: 'Công ty được thành lập vào năm 2010.' },
              { word: 'determine', transcription: "/dɪ'tɜːmɪn/", word_type: 'v.', meaning: 'quyết định, xác định', example: 'We need to determine the cause of the problem.', example_vi: 'Chúng ta cần xác định nguyên nhân của vấn đề.' },
              { word: 'office', transcription: "/'ɒfɪs/", word_type: 'n.', meaning: 'văn phòng', example: 'She works in a modern office.', example_vi: 'Cô ấy làm việc trong một văn phòng hiện đại.' },
              { word: 'colleague', transcription: "/'kɒliːɡ/", word_type: 'n.', meaning: 'đồng nghiệp', example: 'My colleagues are very helpful.', example_vi: 'Các đồng nghiệp của tôi rất hữu ích.' },
              { word: 'meeting', transcription: "/'miːtɪŋ/", word_type: 'n.', meaning: 'cuộc họp', example: 'The meeting starts at 9 AM.', example_vi: 'Cuộc họp bắt đầu lúc 9 giờ sáng.' },
              { word: 'manager', transcription: "/'mænɪdʒər/", word_type: 'n.', meaning: 'quản lý', example: 'The manager approved the plan.', example_vi: 'Người quản lý đã phê duyệt kế hoạch.' },
              { word: 'report', transcription: "/rɪ'pɔːt/", word_type: 'n.', meaning: 'báo cáo', example: 'Please submit your weekly report.', example_vi: 'Vui lòng nộp báo cáo hàng tuần của bạn.' },
              { word: 'schedule', transcription: "/'ʃedjuːl/", word_type: 'n.', meaning: 'lịch trình', example: 'Check your schedule for tomorrow.', example_vi: 'Kiểm tra lịch trình của bạn cho ngày mai.' },
              { word: 'file', transcription: "/faɪl/", word_type: 'n.', meaning: 'hồ sơ, tệp', example: 'Please file these documents.', example_vi: 'Vui lòng lưu trữ những tài liệu này.' }
            ]
          },
          {
            slug: 'easy-lesson-2',
            title: '📄 Lesson 2: Daily Operations',
            description: 'Từ vựng về hoạt động và dịch vụ hàng ngày trong doanh nghiệp.',
            sort_order: 2,
            words: [
              { word: 'resolve', transcription: "/rɪ'zɒlv/", word_type: 'v.', meaning: 'giải quyết', example: 'They resolved the dispute quickly.', example_vi: 'Họ đã giải quyết tranh chấp một cách nhanh chóng.' },
              { word: 'agree', transcription: "/ə'ɡriː/", word_type: 'v.', meaning: 'đồng ý', example: 'We agree on the terms.', example_vi: 'Chúng tôi đồng ý về các điều khoản.' },
              { word: 'provide', transcription: "/prə'vaɪd/", word_type: 'v.', meaning: 'cung cấp', example: 'They provide financial services.', example_vi: 'Họ cung cấp dịch vụ tài chính.' },
              { word: 'customer', transcription: "/'kʌstəmər/", word_type: 'n.', meaning: 'khách hàng', example: 'The customer is always right.', example_vi: 'Khách hàng luôn luôn đúng.' },
              { word: 'service', transcription: "/'sɜːvɪs/", word_type: 'n.', meaning: 'dịch vụ', example: 'The service here is excellent.', example_vi: 'Dịch vụ ở đây rất xuất sắc.' },
              { word: 'phone', transcription: "/fəʊn/", word_type: 'n.', meaning: 'điện thoại', example: 'Please answer the phone.', example_vi: 'Vui lòng nghe điện thoại.' },
              { word: 'email', transcription: "/'iːmeɪl/", word_type: 'n.', meaning: 'thư điện tử', example: 'Send me an email with details.', example_vi: 'Gửi cho tôi email với các chi tiết.' },
              { word: 'message', transcription: "/'mesɪdʒ/", word_type: 'n.', meaning: 'tin nhắn', example: 'I left a message for him.', example_vi: 'Tôi đã để lại tin nhắn cho anh ấy.' },
              { word: 'reply', transcription: "/rɪ'plaɪ/", word_type: 'v.', meaning: 'trả lời', example: 'Please reply to the email soon.', example_vi: 'Vui lòng trả lời email sớm.' },
              { word: 'request', transcription: "/rɪ'kwest/", word_type: 'n.', meaning: 'yêu cầu', example: 'We received your request.', example_vi: 'Chúng tôi đã nhận được yêu cầu của bạn.' }
            ]
          },
          {
            slug: 'easy-lesson-3',
            title: '📄 Lesson 3: Logistics & Events',
            description: 'Từ vựng về logistics, chuẩn bị sự kiện và vận chuyển.',
            sort_order: 3,
            words: [
              { word: 'cancel', transcription: "/'kænsəl/", word_type: 'v.', meaning: 'hủy bỏ', example: 'The flight was canceled.', example_vi: 'Chuyến bay đã bị hủy.' },
              { word: 'deliver', transcription: "/dɪ'lɪvər/", word_type: 'v.', meaning: 'giao hàng', example: 'The package was delivered on time.', example_vi: 'Gói hàng được giao đúng giờ.' },
              { word: 'attend', transcription: "/ə'tend/", word_type: 'v.', meaning: 'tham dự', example: 'She attended the conference.', example_vi: 'Cô ấy đã tham dự hội nghị.' },
              { word: 'prepare', transcription: "/prɪ'peər/", word_type: 'v.', meaning: 'chuẩn bị', example: 'He prepared the presentation.', example_vi: 'Anh ấy đã chuẩn bị bài thuyết trình.' },
              { word: 'event', transcription: "/ɪ'vent/", word_type: 'n.', meaning: 'sự kiện', example: 'The event was a great success.', example_vi: 'Sự kiện đã rất thành công.' },
              { word: 'invite', transcription: "/ɪn'vaɪt/", word_type: 'v.', meaning: 'mời', example: 'They invited all employees.', example_vi: 'Họ đã mời tất cả nhân viên.' },
              { word: 'guest', transcription: "/ɡest/", word_type: 'n.', meaning: 'khách mời', example: 'All guests must register.', example_vi: 'Tất cả khách mời phải đăng ký.' },
              { word: 'package', transcription: "/'pækɪdʒ/", word_type: 'n.', meaning: 'gói hàng', example: 'The package arrived this morning.', example_vi: 'Gói hàng đã đến sáng nay.' },
              { word: 'ship', transcription: "/ʃɪp/", word_type: 'v.', meaning: 'vận chuyển', example: 'We ship to all countries.', example_vi: 'Chúng tôi vận chuyển đến mọi quốc gia.' },
              { word: 'venue', transcription: "/'venjuː/", word_type: 'n.', meaning: 'địa điểm tổ chức', example: 'The venue can hold 500 people.', example_vi: 'Địa điểm có thể chứa 500 người.' }
            ]
          }
        ]
      },
      {
        slug: 'toeic-starter',
        title: 'Starter TOEIC Vocabulary',
        description: 'Từ vựng khởi động, rèn luyện nghe đọc (Mục tiêu 450 - 550).',
        sort_order: 3,
        lessons: [
          {
            slug: 'starter-lesson-1',
            title: '📄 Lesson 1: Registration & Rules',
            description: 'Từ vựng về đăng ký, nộp bài và các yêu cầu quy định.',
            sort_order: 1,
            words: [
              { word: 'register', transcription: "/'redʒɪstər/", word_type: 'v.', meaning: 'đăng ký', example: 'You must register for the course.', example_vi: 'Bạn phải đăng ký khóa học.' },
              { word: 'require', transcription: "/rɪ'kwaɪər/", word_type: 'v.', meaning: 'yêu cầu', example: 'The job requires travel.', example_vi: 'Công việc này yêu cầu đi lại.' },
              { word: 'submit', transcription: "/səb'mɪt/", word_type: 'v.', meaning: 'nộp', example: 'Submit your report by Friday.', example_vi: 'Nộp báo cáo của bạn trước thứ Sáu.' },
              { word: 'policy', transcription: "/'pɒlɪsi/", word_type: 'n.', meaning: 'chính sách', example: 'The company updated its leave policy.', example_vi: 'Công ty đã cập nhật chính sách nghỉ phép.' },
              { word: 'rule', transcription: "/ruːl/", word_type: 'n.', meaning: 'quy tắc', example: 'Follow the rules carefully.', example_vi: 'Tuân thủ các quy tắc một cách cẩn thận.' },
              { word: 'permit', transcription: "/pə'mɪt/", word_type: 'v.', meaning: 'cho phép', example: 'Parking is not permitted here.', example_vi: 'Đỗ xe không được phép ở đây.' },
              { word: 'form', transcription: "/fɔːm/", word_type: 'n.', meaning: 'biểu mẫu', example: 'Please fill out this form.', example_vi: 'Vui lòng điền vào biểu mẫu này.' },
              { word: 'document', transcription: "/'dɒkjumənt/", word_type: 'n.', meaning: 'tài liệu', example: 'Keep all important documents safe.', example_vi: 'Giữ tất cả các tài liệu quan trọng an toàn.' },
              { word: 'sign', transcription: "/saɪn/", word_type: 'v.', meaning: 'ký (tên)', example: 'Please sign the agreement.', example_vi: 'Vui lòng ký vào thỏa thuận.' },
              { word: 'deadline', transcription: "/'dedlaɪn/", word_type: 'n.', meaning: 'thời hạn', example: 'The deadline is next Monday.', example_vi: 'Thời hạn là thứ Hai tới.' }
            ]
          },
          {
            slug: 'starter-lesson-2',
            title: '📄 Lesson 2: Decisions & Promotions',
            description: 'Từ vựng về thăng chức, phê duyệt và sự trì hoãn trong công việc.',
            sort_order: 2,
            words: [
              { word: 'approve', transcription: "/ə'pruːv/", word_type: 'v.', meaning: 'chấp thuận', example: 'The board approved the budget.', example_vi: 'Ban giám đốc đã phê duyệt ngân sách.' },
              { word: 'delay', transcription: "/dɪ'leɪ/", word_type: 'v.', meaning: 'trì hoãn', example: 'The train was delayed.', example_vi: 'Chuyến tàu đã bị hoãn.' },
              { word: 'promote', transcription: "/prə'məʊt/", word_type: 'v.', meaning: 'thăng chức, quảng bá', example: 'She was promoted to manager.', example_vi: 'Cô ấy đã được thăng chức lên quản lý.' },
              { word: 'decide', transcription: "/dɪ'saɪd/", word_type: 'v.', meaning: 'quyết định', example: 'We need to decide quickly.', example_vi: 'Chúng ta cần quyết định nhanh chóng.' },
              { word: 'select', transcription: "/sɪ'lekt/", word_type: 'v.', meaning: 'lựa chọn', example: 'Select the best candidate.', example_vi: 'Chọn ứng viên tốt nhất.' },
              { word: 'recommend', transcription: "/ˌrekə'mend/", word_type: 'v.', meaning: 'đề nghị, giới thiệu', example: 'I recommend the new software.', example_vi: 'Tôi đề nghị phần mềm mới.' },
              { word: 'announce', transcription: "/ə'naʊns/", word_type: 'v.', meaning: 'thông báo', example: 'They announced the results today.', example_vi: 'Họ đã thông báo kết quả hôm nay.' },
              { word: 'position', transcription: "/pə'zɪʃən/", word_type: 'n.', meaning: 'vị trí, chức vụ', example: 'She applied for a senior position.', example_vi: 'Cô ấy đã nộp đơn cho một vị trí cấp cao.' },
              { word: 'interview', transcription: "/'ɪntəvjuː/", word_type: 'n.', meaning: 'phỏng vấn', example: 'The interview is at 2 PM.', example_vi: 'Buổi phỏng vấn lúc 2 giờ chiều.' },
              { word: 'candidate', transcription: "/'kændɪdɪt/", word_type: 'n.', meaning: 'ứng viên', example: 'We have three strong candidates.', example_vi: 'Chúng tôi có ba ứng viên mạnh.' }
            ]
          },
          {
            slug: 'starter-lesson-3',
            title: '📄 Lesson 3: Business Tasks',
            description: 'Từ vựng về tiến hành họp, xác nhận thông tin và hóa đơn.',
            sort_order: 3,
            words: [
              { word: 'conduct', transcription: "/kən'dʌkt/", word_type: 'v.', meaning: 'tiến hành', example: 'They conducted a survey.', example_vi: 'Họ đã tiến hành một cuộc khảo sát.' },
              { word: 'confirm', transcription: "/kən'fɜːm/", word_type: 'v.', meaning: 'xác nhận', example: 'Please confirm your email.', example_vi: 'Vui lòng xác nhận email của bạn.' },
              { word: 'participate', transcription: "/pɑː'tɪsɪpeɪt/", word_type: 'v.', meaning: 'tham gia', example: 'Everyone participated in the meeting.', example_vi: 'Mọi người đều tham gia cuộc họp.' },
              { word: 'invoice', transcription: "/'ɪnvɔɪs/", word_type: 'n.', meaning: 'hóa đơn', example: 'Please pay the invoice.', example_vi: 'Vui lòng thanh toán hóa đơn.' },
              { word: 'agenda', transcription: "/ə'dʒendə/", word_type: 'n.', meaning: 'chương trình nghị sự', example: 'The agenda for today includes a review.', example_vi: 'Chương trình nghị sự hôm nay bao gồm một buổi đánh giá.' },
              { word: 'presentation', transcription: "/ˌprezən'teɪʃən/", word_type: 'n.', meaning: 'bài thuyết trình', example: 'Her presentation was impressive.', example_vi: 'Bài thuyết trình của cô ấy rất ấn tượng.' },
              { word: 'project', transcription: "/'prɒdʒekt/", word_type: 'n.', meaning: 'dự án', example: 'The project was completed on time.', example_vi: 'Dự án đã hoàn thành đúng hạn.' },
              { word: 'budget', transcription: "/'bʌdʒɪt/", word_type: 'n.', meaning: 'ngân sách', example: 'We need to cut the budget.', example_vi: 'Chúng ta cần cắt giảm ngân sách.' },
              { word: 'cost', transcription: "/kɒst/", word_type: 'n.', meaning: 'chi phí', example: 'The cost of production increased.', example_vi: 'Chi phí sản xuất tăng lên.' },
              { word: 'profit', transcription: "/'prɒfɪt/", word_type: 'n.', meaning: 'lợi nhuận', example: 'The company made a large profit.', example_vi: 'Công ty đã đạt lợi nhuận lớn.' }
            ]
          }
        ]
      },
      {
        slug: 'toeic-hackers',
        title: 'Hackers TOEIC Vocabulary',
        description: 'Từ vựng nâng cao bám sát xu hướng đề khó (Mục tiêu 650 - 850).',
        sort_order: 4,
        lessons: [
          {
            slug: 'hackers-lesson-1',
            title: '📄 Lesson 1: Agreements & Compliance',
            description: 'Từ vựng nâng cao về thương lượng, hợp tác và tuân thủ luật lệ.',
            sort_order: 1,
            words: [
              { word: 'negotiate', transcription: "/nɪ'ɡəʊʃɪeɪt/", word_type: 'v.', meaning: 'thương lượng', example: 'They negotiated a new deal.', example_vi: 'Họ đã thương lượng một thỏa thuận mới.' },
              { word: 'cooperate', transcription: "/kəʊ'ɒpəreɪt/", word_type: 'v.', meaning: 'hợp tác', example: 'We need to cooperate with them.', example_vi: 'Chúng ta cần hợp tác với họ.' },
              { word: 'comply', transcription: "/kəm'plaɪ/", word_type: 'v.', meaning: 'tuân thủ', example: 'All products must comply with regulations.', example_vi: 'Tất cả sản phẩm phải tuân thủ quy định.' },
              { word: 'compromise', transcription: "/'kɒmprəmaɪz/", word_type: 'n.', meaning: 'sự thỏa hiệp', example: 'They reached a compromise.', example_vi: 'Họ đã đạt được sự thỏa hiệp.' },
              { word: 'regulation', transcription: "/ˌreɡju'leɪʃən/", word_type: 'n.', meaning: 'quy định, điều lệ', example: 'The new regulation affects all businesses.', example_vi: 'Quy định mới ảnh hưởng đến tất cả doanh nghiệp.' },
              { word: 'obligation', transcription: "/ˌɒblɪ'ɡeɪʃən/", word_type: 'n.', meaning: 'nghĩa vụ', example: 'You have an obligation to your client.', example_vi: 'Bạn có nghĩa vụ với khách hàng của mình.' },
              { word: 'lease', transcription: "/liːs/", word_type: 'n.', meaning: 'hợp đồng thuê', example: 'They signed a two-year lease.', example_vi: 'Họ đã ký hợp đồng thuê hai năm.' },
              { word: 'liability', transcription: "/ˌlaɪə'bɪlɪti/", word_type: 'n.', meaning: 'trách nhiệm pháp lý', example: 'The company denied liability.', example_vi: 'Công ty phủ nhận trách nhiệm pháp lý.' },
              { word: 'penalty', transcription: "/'penəlti/", word_type: 'n.', meaning: 'hình phạt, tiền phạt', example: 'There is a penalty for late payment.', example_vi: 'Có tiền phạt cho việc thanh toán trễ.' },
              { word: 'enforce', transcription: "/ɪn'fɔːs/", word_type: 'v.', meaning: 'thực thi, thi hành', example: 'The law must be enforced equally.', example_vi: 'Pháp luật phải được thực thi bình đẳng.' }
            ]
          },
          {
            slug: 'hackers-lesson-2',
            title: '📄 Lesson 2: Execution & Postponement',
            description: 'Từ vựng về triển khai dự án, thay thế nhân sự và trì hoãn lịch trình.',
            sort_order: 2,
            words: [
              { word: 'implement', transcription: "/'implɪmənt/", word_type: 'v.', meaning: 'thực hiện, triển khai', example: 'We will implement the new policy.', example_vi: 'Chúng tôi sẽ triển khai chính sách mới.' },
              { word: 'substitute', transcription: "/'sʌbstɪtjuːt/", word_type: 'v.', meaning: 'thay thế', example: 'You can substitute butter with oil.', example_vi: 'Bạn có thể thay thế bơ bằng dầu.' },
              { word: 'postpone', transcription: "/pəʊst'pəʊn/", word_type: 'v.', meaning: 'hoãn lại', example: 'The match was postponed.', example_vi: 'Trận đấu đã bị hoãn lại.' },
              { word: 'execute', transcription: "/'eksɪkjuːt/", word_type: 'v.', meaning: 'thực thi, thực hiện', example: 'They executed the plan perfectly.', example_vi: 'Họ đã thực thi kế hoạch một cách hoàn hảo.' },
              { word: 'terminate', transcription: "/'tɜːmɪneɪt/", word_type: 'v.', meaning: 'chấm dứt', example: 'The contract was terminated early.', example_vi: 'Hợp đồng đã bị chấm dứt sớm.' },
              { word: 'supervise', transcription: "/'suːpəvaɪz/", word_type: 'v.', meaning: 'giám sát', example: 'He supervises the production team.', example_vi: 'Anh ấy giám sát nhóm sản xuất.' },
              { word: 'delegate', transcription: "/'delɪɡɪt/", word_type: 'v.', meaning: 'ủy thác, giao việc', example: 'She delegated tasks to her team.', example_vi: 'Cô ấy giao việc cho nhóm của mình.' },
              { word: 'allocate', transcription: "/'æləkeɪt/", word_type: 'v.', meaning: 'phân bổ', example: 'They allocated the budget fairly.', example_vi: 'Họ đã phân bổ ngân sách một cách công bằng.' },
              { word: 'reschedule', transcription: "/riː'ʃedjuːl/", word_type: 'v.', meaning: 'sắp xếp lại lịch', example: 'The meeting was rescheduled for Friday.', example_vi: 'Cuộc họp đã được sắp xếp lại vào thứ Sáu.' },
              { word: 'coordinate', transcription: "/kəʊ'ɔːdɪneɪt/", word_type: 'v.', meaning: 'phối hợp, điều phối', example: 'We coordinate with all departments.', example_vi: 'Chúng tôi phối hợp với tất cả các phòng ban.' }
            ]
          },
          {
            slug: 'hackers-lesson-3',
            title: '📄 Lesson 3: Development & Assessment',
            description: 'Từ vựng về tích lũy năng lực, cộng tác liên phòng ban và đánh giá hiệu suất.',
            sort_order: 3,
            words: [
              { word: 'accumulate', transcription: "/ə'kjuːmjəleɪt/", word_type: 'v.', meaning: 'tích lũy', example: 'You can accumulate points.', example_vi: 'Bạn có thể tích lũy điểm.' },
              { word: 'collaborate', transcription: "/kə'læbəreɪt/", word_type: 'v.', meaning: 'cộng tác', example: 'We collaborate on this project.', example_vi: 'Chúng tôi cộng tác trong dự án này.' },
              { word: 'prohibit', transcription: "/prə'hɪbɪt/", word_type: 'v.', meaning: 'cấm', example: 'Smoking is prohibited.', example_vi: 'Hút thuốc bị cấm.' },
              { word: 'evaluate', transcription: "/ɪ'væljueɪt/", word_type: 'v.', meaning: 'đánh giá', example: 'The performance was evaluated.', example_vi: 'Hiệu suất đã được đánh giá.' },
              { word: 'appraisal', transcription: "/ə'preɪzəl/", word_type: 'n.', meaning: 'sự đánh giá, thẩm định', example: 'The annual appraisal takes place in December.', example_vi: 'Đánh giá hàng năm diễn ra vào tháng 12.' },
              { word: 'productivity', transcription: "/ˌprɒdʌk'tɪvɪti/", word_type: 'n.', meaning: 'năng suất', example: 'The new tools increased productivity.', example_vi: 'Các công cụ mới đã tăng năng suất.' },
              { word: 'efficiency', transcription: "/ɪ'fɪʃənsi/", word_type: 'n.', meaning: 'hiệu quả', example: 'We improved our operational efficiency.', example_vi: 'Chúng tôi đã cải thiện hiệu quả hoạt động.' },
              { word: 'innovative', transcription: "/'ɪnəveɪtɪv/", word_type: 'adj.', meaning: 'sáng tạo, đổi mới', example: 'The company launched an innovative product.', example_vi: 'Công ty đã ra mắt một sản phẩm sáng tạo.' },
              { word: 'strategy', transcription: "/'strætɪdʒi/", word_type: 'n.', meaning: 'chiến lược', example: 'They developed a new marketing strategy.', example_vi: 'Họ đã xây dựng một chiến lược marketing mới.' },
              { word: 'merger', transcription: "/'mɜːdʒər/", word_type: 'n.', meaning: 'sự sáp nhập', example: 'The merger was completed last quarter.', example_vi: 'Việc sáp nhập đã hoàn tất vào quý trước.' }
            ]
          }
        ]
      }
    ];

    for (const c of newCourses) {
      // 1. Create or get Course
      const [existingCourse] = await connection.execute('SELECT id FROM Courses WHERE slug = ?', [c.slug]);
      let courseId;
      if (existingCourse.length > 0) {
        courseId = existingCourse[0].id;
        console.log(`Course exists: ${c.title} (ID: ${courseId}). Updating...`);
        await connection.execute('UPDATE Courses SET description = ?, title = ?, sort_order = ? WHERE id = ?', [c.description, c.title, c.sort_order, courseId]);
      } else {
        const [insertRes] = await connection.execute(
          'INSERT INTO Courses (slug, title, description, language, sort_order) VALUES (?, ?, ?, ?, ?)',
          [c.slug, c.title, c.description, 'en', c.sort_order]
        );
        courseId = insertRes.insertId;
        console.log(`Created new course: ${c.title} (ID: ${courseId})`);
      }

      // Delete existing topics under this course to rebuild the exact lesson structure
      await connection.execute('DELETE FROM Topics WHERE course_id = ?', [courseId]);
      console.log(`  Cleared old topics for Course ID: ${courseId}`);

      // 2. Create Topics (lessons) under this Course
      for (const les of c.lessons) {
        const [insertTopicRes] = await connection.execute(
          'INSERT INTO Topics (course_id, slug, title, description, sort_order) VALUES (?, ?, ?, ?, ?)',
          [courseId, les.slug, les.title, les.description, les.sort_order]
        );
        const topicId = insertTopicRes.insertId;
        console.log(`  Created topic/lesson: ${les.title} (ID: ${topicId})`);

        // 3. Add Words under this Topic
        for (const w of les.words) {
          await connection.execute(
            'INSERT INTO Flashcards (topic_id, word, transcription, meaning, word_type, example, example_vi) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [topicId, w.word, w.transcription, w.meaning, w.word_type, w.example, w.example_vi]
          );
          console.log(`    Added word: ${w.word}`);
        }
      }
    }

    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error during seeding:', error);
  } finally {
    await connection.end();
  }
}

seed();
