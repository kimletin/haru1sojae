'use client';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-bold text-orange-500 dark:text-orange-400 mb-1">{title}</p>
      <div className="text-sm text-gray-700 dark:text-zinc-300 leading-relaxed space-y-1">{children}</div>
    </div>
  );
}

export default function PrivacyTab() {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden">
      <div className="bg-orange-200 dark:bg-orange-900/50 border-b border-orange-200 dark:border-orange-800 px-4 py-2.5">
        <h3 className="text-sm font-semibold text-center text-gray-800 dark:text-zinc-100">개인정보처리방침</h3>
      </div>

      <div className="p-6 space-y-5">
        <p className="text-sm text-gray-700 dark:text-zinc-300 leading-relaxed">
          하루1소재(이하 &quot;서비스&quot;)는 별도의 회원가입 없이 이용할 수 있으며, 이용자의 개인정보를 서버에 수집·저장하지 않습니다. 서비스는 「개인정보 보호법」 제30조에 따라 이용자의 개인정보 처리에 관한 사항을 다음과 같이 안내합니다.
        </p>

        <Section title="1. 개인정보의 처리 목적">
          <p>서비스는 아래 목적으로만 정보를 이용하며, 그 외의 목적으로는 이용하지 않습니다.</p>
          <p>① 캐릭터 정보 조회: 이용자가 입력한 캐릭터 닉네임으로 넥슨 OpenAPI에서 공개된 게임 정보를 조회합니다.<br />② 이용 편의 제공: 이용자가 입력한 설정값과 환경설정(다크 모드 등)을 이용자 브라우저에 저장하여 재방문 시 복원합니다.</p>
        </Section>

        <Section title="2. 처리하는 개인정보의 항목">
          <p>서비스는 회원가입을 받지 않으며, 이름·연락처·아이디·비밀번호 등 개인을 식별할 수 있는 정보를 수집하지 않습니다.</p>
          <p>① 캐릭터 닉네임: 넥슨 OpenAPI 조회 목적으로만 사용되며 서비스 서버에 저장되지 않습니다.<br />② 브라우저 저장 정보: 캐릭터 설정값, 환경설정 등은 이용자 브라우저의 로컬 저장소(localStorage)에만 저장되어 이용자 기기에 보관됩니다.</p>
          <p>서비스는 처리 목적에 필요한 최소한의 정보만 이용합니다.</p>
        </Section>

        <Section title="3. 개인정보의 처리 및 보유 기간">
          <p>서비스는 개인정보를 서버에 보관하지 않습니다. 브라우저에 저장된 정보는 이용자가 삭제하기 전까지 이용자 기기에만 보관되며, 이용자가 브라우저 데이터를 삭제하면 즉시 삭제됩니다.</p>
        </Section>

        <Section title="4. 개인정보의 파기 절차 및 방법">
          <p>서비스가 서버에 보관하는 개인정보가 없어 회사 차원의 별도 파기 절차는 없습니다. 브라우저에 저장된 정보는 이용자가 브라우저 설정(사이트 데이터·저장소 삭제)을 통해 직접 파기할 수 있습니다.</p>
        </Section>

        <Section title="5. 정보주체와 법정대리인의 권리·의무 및 그 행사방법">
          <p>이용자(정보주체)는 언제든지 개인정보의 열람·정정·삭제·처리정지를 요구할 권리가 있습니다. 서비스는 정보를 서버에 보관하지 않으므로, 이용자는 브라우저의 저장소 및 사이트 데이터 삭제를 통해 직접 해당 권리를 행사할 수 있으며, 그 밖의 문의는 아래 개인정보 보호책임자에게 요청할 수 있습니다.</p>
        </Section>

        <Section title="6. 개인정보의 안전성 확보조치">
          <p>서비스는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 하고 있습니다.</p>
          <p>① 개인정보를 서버에 저장하지 않아 유출 위험을 원천적으로 최소화합니다.<br />② 넥슨 OpenAPI 통신 및 사이트 접속은 암호화(HTTPS) 통신을 통해 이루어집니다.<br />③ 처리 목적에 필요한 최소한의 정보만 처리하는 내부 원칙을 운영합니다.</p>
        </Section>

        <Section title="7. 쿠키 등 자동 수집 장치">
          <p>서비스는 광고용 쿠키나 이용자를 개인적으로 식별·추적하는 도구를 사용하지 않습니다.</p>
          <p>다만 서비스 개선을 위한 방문 통계 파악을 위해 쿠키를 사용하지 않는(cookieless) 분석 도구인 Vercel Analytics를 이용합니다. 이 도구는 개인을 식별하지 않으며 익명화된 집계 정보(방문 수, 페이지 조회 등)만 수집·처리합니다.</p>
        </Section>

        <Section title="8. 개인정보 보호책임자 및 문의">
          <p>개인정보 관련 문의는 아래로 연락주시기 바랍니다.</p>
          <p>담당: 하루1소재 운영팀<br />이메일: haru1sojae@gmail.com</p>
        </Section>

        <Section title="9. 정보주체의 권익침해 구제방법">
          <p>개인정보 침해로 인한 상담·신고는 아래 기관에 문의하실 수 있습니다.</p>
          <p>
            개인정보분쟁조정위원회 (국번없이) 1833-6972 (kopico.go.kr)<br />
            개인정보침해신고센터 (국번없이) 118 (privacy.kisa.or.kr)<br />
            대검찰청 (국번없이) 1301 (spo.go.kr)<br />
            경찰청 (국번없이) 182 (ecrm.cyber.go.kr)
          </p>
        </Section>

        <Section title="10. 개인정보처리방침의 변경">
          <p>본 개인정보처리방침의 내용에 변경이 있을 경우 개정 최소 7일 전에 서비스 내 공지를 통해 안내하며, 이용자의 권리에 중대한 변경이 발생하는 경우에는 최소 30일 전에 안내합니다.</p>
        </Section>

        <p className="text-xs text-gray-400 dark:text-zinc-500 pt-2 border-t border-gray-100 dark:border-zinc-700">
          시행일자: 2026년 6월 15일
        </p>
      </div>
    </div>
  );
}
