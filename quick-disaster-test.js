async function quickDisasterTest() {
  console.log('⚡ 빠른 재난 대응 테스트');
  console.log('=' .repeat(50));

  const testCases = [
    // 자연재난
    { type: '황사', query: '황사 발생시 대응 방법은?' },
    { type: '폭염', query: '폭염시 안전 수칙은?' },
    { type: '태풍', query: '태풍 경보시 학교 대응은?' },
    { type: '집중호우', query: '집중호우 발생시 대피 방법은?' },
    { type: '침수', query: '침수 시 행동요령은?' },
    { type: '대설', query: '폭설시 학교 안전 대책은?' },
    { type: '한파', query: '한파주의보 발령시 조치사항은?' },
    { type: '낙뢰', query: '천둥번개시 안전 수칙은?' },
    { type: '산사태', query: '산사태 위험시 대피 방법은?' },
    { type: '지진', query: '지진 발생시 행동요령은?' },
    { type: '지진해일', query: '쓰나미 경보시 대응 방법은?' },
    { type: '화산폭발', query: '화산재 날아올 때 대응 방법은?' },
    
    // 사회재난
    { type: '미세먼지', query: '미세먼지 심할 때 대응 방법은?' },
    { type: '화재', query: '학교 화재시 대피 방법은?' },
    { type: '산불', query: '산불 발생시 대피 방법은?' },
    { type: '감염병', query: '감염병 발생시 학교 대응은?' },
    { type: '교통안전', query: '등하교시 교통사고 예방법은?' },
    { type: '인파사고', query: '많은 사람 몰릴 때 안전 수칙은?' },
    { type: '건축물붕괴', query: '건물 붕괴 위험시 대피 요령은?' },
    { type: '화학물질유출', query: '화학물질 유출시 대응 방법은?' },
    { type: '방사능', query: '방사능 누출시 대피 방법은?' }
  ];

  const results = { success: 0, failed: 0, total: testCases.length };
  const failedTypes = [];

  for (const test of testCases) {
    console.log(`🔍 ${test.type}: "${test.query}"`);

    try {
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: test.query }),
      });

      const data = await response.json();
      const hasAnswer = data.answer && 
                       !data.answer.includes('찾을 수 없습니다') && 
                       !data.answer.includes('cannot find') &&
                       !data.answer.includes('No relevant');
      
      if (hasAnswer) {
        console.log(`  ✅ 성공 (소스: ${data.sources?.length || 0}개)`);
        results.success++;
      } else {
        console.log(`  ❌ 실패 - "${data.answer?.substring(0, 50)}..."`);
        results.failed++;
        failedTypes.push(test.type);
      }

    } catch (error) {
      console.log(`  💥 오류: ${error.message}`);
      results.failed++;
      failedTypes.push(test.type);
    }

    // 짧은 대기
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 테스트 결과');
  console.log('='.repeat(50));
  console.log(`✅ 성공: ${results.success}/${results.total} (${Math.round(results.success/results.total*100)}%)`);
  console.log(`❌ 실패: ${results.failed}/${results.total}`);

  if (failedTypes.length > 0) {
    console.log('\n❌ 실패한 재난 유형:');
    failedTypes.forEach(type => console.log(`  - ${type}`));
  }

  if (results.success / results.total >= 0.8) {
    console.log('\n🎉 전반적으로 우수한 성능!');
  } else if (results.success / results.total >= 0.6) {
    console.log('\n⚠️  일부 개선이 필요합니다.');
  } else {
    console.log('\n🔧 많은 개선이 필요합니다.');
  }

  return { results, failedTypes };
}

quickDisasterTest().catch(console.error);