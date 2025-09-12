async function testAllManualDisasters() {
  console.log('🔍 Testing ALL Disaster Types from Manual');
  console.log('=' .repeat(80));

  const disasterTests = [
    // 자연재난 (Natural Disasters)
    {
      category: '자연재난',
      disasters: [
        { name: '황사', queries: ['황사가 발생했을 때 어떻게 해야 하나요?', '황사 발생시 학교 대응 방법은?'] },
        { name: '폭염', queries: ['폭염주의보 발령시 학교 조치사항은?', '더위로 인한 열사병 예방법은?'] },
        { name: '태풍', queries: ['태풍이 올 때 학교 안전 조치는?', '태풍 경보시 학생 대피 절차는?'] },
        { name: '집중호우·침수', queries: ['집중호우 발생시 대피 방법은?', '학교가 침수되면 어떻게 해야 하나요?'] },
        { name: '대설·한파', queries: ['폭설시 학교 안전 대책은?', '한파주의보 발령시 조치사항은?'] },
        { name: '낙뢰', queries: ['천둥번개가 칠 때 어떻게 해야 하나요?', '낙뢰 발생시 안전 수칙은?'] },
        { name: '산사태', queries: ['산사태 위험시 대피 방법은?', '산사태 경보 발령시 행동요령은?'] },
        { name: '지진', queries: ['지진이 발생하면 어떻게 행동해야 하나요?', '지진 발생시 학교에서 대피 방법은?'] },
        { name: '지진해일', queries: ['지진해일(쓰나미) 경보시 대응 방법은?', '해일 발생시 대피 요령은?'] },
        { name: '화산폭발', queries: ['화산재가 날아올 때 어떻게 해야 하나요?', '화산폭발시 안전 조치는?'] }
      ]
    },
    // 사회재난 (Social Disasters)
    {
      category: '사회재난',
      disasters: [
        { name: '미세먼지', queries: ['미세먼지가 심할 때 학교 대응은?', '미세먼지 나쁨 단계시 조치사항은?'] },
        { name: '화재', queries: ['학교 화재시 대피 방법은?', '화재 발생시 소화기 사용법은?'] },
        { name: '산불', queries: ['산불 발생시 학생 대피 방법은?', '산불 연기로 인한 피해는 무엇인가요?'] },
        { name: '감염병', queries: ['감염병 발생시 학교 대응 절차는?', '학교 내 감염병 확산 방지 방법은?'] },
        { name: '교통안전', queries: ['등하교시 교통사고 예방 방법은?', '스쿨버스 안전 수칙은?'] },
        { name: '다중운집 인파사고', queries: ['많은 사람이 몰릴 때 안전 수칙은?', '인파 사고 예방 방법은?'] },
        { name: '건축물 붕괴', queries: ['건물이 무너질 위험이 있을 때 어떻게 해야 하나요?', '건축물 붕괴시 대피 요령은?'] },
        { name: '화학물질 유출사고', queries: ['화학물질 유출시 대응 방법은?', '독성 가스 누출시 행동요령은?'] },
        { name: '방사능 재난', queries: ['방사능 누출시 대피 방법은?', '방사능 재난시 안전 조치는?'] }
      ]
    }
  ];

  const results = [];

  for (const category of disasterTests) {
    console.log(`\n📋 ${category.category} 테스트`);
    console.log('-'.repeat(60));

    for (const disaster of category.disasters) {
      console.log(`\n🔸 ${disaster.name} 테스트`);
      
      const disasterResult = {
        category: category.category,
        name: disaster.name,
        queries: [],
        totalQueries: disaster.queries.length,
        successCount: 0,
        avgSources: 0
      };

      for (const query of disaster.queries) {
        console.log(`  질문: "${query}"`);

        try {
          const response = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: query }),
          });

          const data = await response.json();
          const hasAnswer = data.answer && !data.answer.includes('찾을 수 없습니다') && !data.answer.includes('cannot find');
          const sourceCount = data.sources ? data.sources.length : 0;

          if (hasAnswer) {
            console.log(`    ✅ 답변 생성됨 (소스: ${sourceCount}개)`);
            disasterResult.successCount++;
          } else {
            console.log(`    ❌ 답변 생성 실패 (소스: ${sourceCount}개)`);
          }

          disasterResult.queries.push({
            query,
            hasAnswer,
            sourceCount,
            answerPreview: data.answer ? data.answer.substring(0, 100) : 'No answer'
          });

          disasterResult.avgSources += sourceCount;

          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
          console.log(`    ❌ 오류: ${error.message}`);
          disasterResult.queries.push({
            query,
            hasAnswer: false,
            sourceCount: 0,
            error: error.message
          });
        }
      }

      disasterResult.avgSources = disasterResult.avgSources / disasterResult.totalQueries;
      results.push(disasterResult);

      console.log(`  결과: ${disasterResult.successCount}/${disasterResult.totalQueries} 성공 (${Math.round(disasterResult.successCount/disasterResult.totalQueries*100)}%)`);
    }
  }

  // 최종 결과 리포트
  console.log('\n' + '='.repeat(80));
  console.log('📊 최종 테스트 결과 리포트');
  console.log('='.repeat(80));

  let totalQueries = 0;
  let totalSuccess = 0;

  for (const category of ['자연재난', '사회재난']) {
    const categoryResults = results.filter(r => r.category === category);
    const categoryQueries = categoryResults.reduce((sum, r) => sum + r.totalQueries, 0);
    const categorySuccess = categoryResults.reduce((sum, r) => sum + r.successCount, 0);

    console.log(`\n📋 ${category}`);
    console.log('-'.repeat(40));

    for (const result of categoryResults) {
      const successRate = Math.round(result.successCount / result.totalQueries * 100);
      const status = successRate === 100 ? '✅' : successRate >= 50 ? '⚠️' : '❌';
      console.log(`  ${status} ${result.name}: ${result.successCount}/${result.totalQueries} (${successRate}%) - 평균 소스: ${result.avgSources.toFixed(1)}`);
    }

    console.log(`  소계: ${categorySuccess}/${categoryQueries} (${Math.round(categorySuccess/categoryQueries*100)}%)`);
    
    totalQueries += categoryQueries;
    totalSuccess += categorySuccess;
  }

  console.log(`\n🎯 전체 결과: ${totalSuccess}/${totalQueries} (${Math.round(totalSuccess/totalQueries*100)}%)`);

  // 실패한 재난 유형 리스트
  const failedDisasters = results.filter(r => r.successCount === 0);
  if (failedDisasters.length > 0) {
    console.log('\n❌ 완전히 실패한 재난 유형:');
    failedDisasters.forEach(d => {
      console.log(`  - ${d.name} (${d.category})`);
    });
  }

  // 부분적으로 실패한 재난 유형
  const partialFailures = results.filter(r => r.successCount > 0 && r.successCount < r.totalQueries);
  if (partialFailures.length > 0) {
    console.log('\n⚠️  부분적 실패 재난 유형:');
    partialFailures.forEach(d => {
      console.log(`  - ${d.name}: ${d.successCount}/${d.totalQueries}`);
    });
  }

  console.log('\n테스트 완료!');
  return results;
}

testAllManualDisasters().catch(console.error);