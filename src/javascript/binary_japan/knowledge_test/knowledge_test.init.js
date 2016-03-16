var KnowledgeTest = (function() {
    "use strict";

    var hiddenClass = 'invisible';

    var submitted = {};
    var randomPicks = [];
    var randomPicksAnswer = {};
    var resultScore = 0;

    var passMsg = 'Congratulations, you have pass the test, our Customer Support will contact you shortly';
    var failMsg = 'Sorry, you have failed the test, please try again after 24 hours.';

    function questionAnswerHandler(ev) {
        var selected = ev.target.value;
        var qid = ev.target.name;
        submitted[qid] = selected === '1';
    }

    function submitHandler() {
        if (Object.keys(submitted).length !== 20) {
            $('#knowledge-test-msg')
                .addClass('notice-msg')
                .text(text.localize('You need to finish all 20 questions.'));
            $("html, body").animate({ scrollTop: 0 }, "slow");
            return;
        }

        // compute score
        for (var k in submitted) {
            if (submitted.hasOwnProperty(k)) {
                resultScore += submitted[k] === randomPicksAnswer[k] ? 1 : 0;
            }
        }
        KnowledgeTestData.sendResult(resultScore);
        // use now as temp, need from backend
        showResult(resultScore, Date.now());

        $("html, body").animate({ scrollTop: 0 }, "slow");
    }

    function showQuestionsTable() {
        for (var j = 0 ; j < randomPicks.length ; j ++) {
            var table = KnowledgeTestUI.createQuestionTable(randomPicks[j]);
            $('#section' + (j + 1) + '-question').append(table);
        }

        $('#knowledge-test-questions input[type=radio]').click(questionAnswerHandler);
        $('#knowledge-test-submit').click(submitHandler);
        $('#knowledge-test-questions').removeClass(hiddenClass);
        $('#knowledge-test-msg').text(text.localize('Please complete the following questions.'));
    }

    function showResult(score, time) {
        $('#knowledge-test-header').text(text.localize('Knowledge Test Result'));
        if (score > 14) {
            $('#knowledge-test-msg').text(text.localize(passMsg));
        } else {
            $('#knowledge-test-msg').text(text.localize(failMsg));
        }

        var $resultTable = KnowledgeTestUI.createResultUI(score, time);

        $('#knowledge-test-container').append($resultTable);
        $('#knowledge-test-questions').addClass(hiddenClass);
    }

    function showDisallowedMsg(jpStatus) {
        var nextTestEpoch = jpStatus.next_test_epoch;
        var lastTestEpoch = jpStatus.last_test_epoch;

        var nextTestDate = new Date(nextTestEpoch * 1000);
        var lastTestDate = new Date(lastTestEpoch * 1000);

        var msgTemplate =
            'Dear customer, you are not allowed to take knowledge test until [_1].\nLast test taken at [_2].';

        var msg = text.localize(msgTemplate)
            .replace('[_1]', nextTestDate.toLocaleString())
            .replace('[_2]', lastTestDate.toLocaleString());

        $('#knowledge-test-questions').addClass(hiddenClass);
        $('#knowledge-test-msg').text(text.localize(msg));
    }

    function showCompletedMsg() {
        var msg = "Dear customer, you've already completed the knowledge test, please proceed to next step.";
        $('#knowledge-test-questions').addClass(hiddenClass);
        $('#knowledge-test-msg').text(text.localize(msg));
    }

    function populateQuestions() {
        randomPicks = KnowledgeTestData.randomPick20();
        for (var i = 0 ; i < 5 ; i ++) {
            for ( var k = 0 ; k < 4 ; k++) {
                var qid = randomPicks[i][k].id;
                var ans = randomPicks[i][k].answer;

                randomPicksAnswer[qid] = ans;
            }
        }

        showQuestionsTable();
    }

    function init() {
        BinarySocket.init({
            onmessage: function(msg) {
                var response = JSON.parse(msg.data);
                var type = response.msg_type;

                var passthrough = response.echo_req.passthrough && response.echo_req.passthrough.key;

                if (type === 'get_settings' && passthrough === 'knowledgetest') {
                    var jpStatus = response.get_settings.jp_account_status;

                    if (!jpStatus) {
                        window.location.href = page.url.url_for('/');
                        return;
                    }

                    switch(jpStatus.status) {
                        case 'jp_knowledge_test_pending': populateQuestions();
                            break;
                        case 'jp_knowledge_test_fail': if (Date.now() >= (jpStatus.next_test_epoch * 1000)) {
                            // show Knowledge Test cannot be taken
                            populateQuestions();
                        } else {
                            showDisallowedMsg(jpStatus);
                        }
                            break;
                        case 'jp_activation_pending': showCompletedMsg();
                            break;
                        default: {
                            console.warn('Unexpected jp status');
                            window.location.href = page.url.url_for('/');
                        }
                    }
                }
            }
        });

        BinarySocket.send({get_settings: 1, passthrough: {key: 'knowledgetest'}});
    }

    function showKnowledgeTestTopBarIfValid(jpStatus) {
        if (!jpStatus) {
            return;
        }
        switch (jpStatus.status) {
            case 'jp_knowledge_test_pending': KnowledgeTestUI.createKnowledgeTestLink();
                break;
            case 'jp_knowledge_test_fail': if (Date.now() >= (jpStatus.next_test_epoch * 1000)) {
                KnowledgeTestUI.createKnowledgeTestLink();
            }
                break;
            default: return;
        }
    }

    return {
        init: init,
        showKnowledgeTestTopBarIfValid: showKnowledgeTestTopBarIfValid
    };
}());
