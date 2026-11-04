// --- 게임 상태 관리 변수 ---
let deck = [];
let playerHand = [];
let dealerHand = [];
let isGameOver = true;

// 💰 배팅 관련 자산 상태 변수
let playerBalance = 1000;
let currentBet = 0;

// --- DOM 요소 연결 ---
const dealerCardsElem = document.getElementById('dealer-cards');
const playerCardsElem = document.getElementById('player-cards');
const dealerScoreElem = document.getElementById('dealer-score');
const playerScoreElem = document.getElementById('player-score');
const gameMessageElem = document.getElementById('game-message');

const playerBalanceElem = document.getElementById('player-balance');
const currentBetElem = document.getElementById('current-bet');

const btnStart = document.getElementById('btn-start');
const btnHit = document.getElementById('btn-hit');
const btnStand = document.getElementById('btn-stand');

// --- 이벤트 리스너 등록 ---
btnStart.addEventListener('click', startGame);
btnHit.addEventListener('click', hit);
btnStand.addEventListener('click', stand);

// --- 💰 배팅 관련 함수들 ---
function addBet(amount) {
    if (!isGameOver) return; // 게임 진행 중엔 배팅 변경 불가

    if (playerBalance >= amount) {
        playerBalance -= amount;
        currentBet += amount;
        updateFinanceUI();
        gameMessageElem.innerText = `${amount}$ 배팅 추가완료! "게임 시작"을 누르세요.`;
    } else {
        gameMessageElem.innerText = "❌ 보유 칩이 부족하여 배팅할 수 없습니다!";
    }
}

function clearBet() {
    if (!isGameOver) return;

    playerBalance += currentBet;
    currentBet = 0;
    updateFinanceUI();
    gameMessageElem.innerText = "배팅이 취소되었습니다. 다시 배팅해주세요.";
}

function updateFinanceUI() {
    playerBalanceElem.innerText = `$${playerBalance}`;
    currentBetElem.innerText = `$${currentBet}`;
}

// --- 1. 카드 덱 생성 함수 ---
function createDeck() {
    const suits = ['spades', 'hearts', 'diamonds', 'clubs'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const symbols = { 'spades': '♠', 'hearts': '♥', 'diamonds': '♦', 'clubs': '♣' };
    
    let newDeck = [];
    for (let suit of suits) {
        for (let value of values) {
            newDeck.push({ suit: suit, value: value, symbol: symbols[suit] });
        }
    }
    return newDeck;
}

// --- 2. 카드 셔플 함수 ---
function shuffleDeck(targetDeck) {
    for (let i = targetDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [targetDeck[i], targetDeck[j]] = [targetDeck[j], targetDeck[i]];
    }
    return targetDeck;
}

// --- 3. 점수 계산 함수 ---
function calculateScore(hand) {
    let score = 0;
    let aceCount = 0;

    for (let card of hand) {
        if (card.value === 'A') {
            aceCount++;
            score += 11;
        } else if (['J', 'Q', 'K'].includes(card.value)) {
            score += 10;
        } else {
            score += parseInt(card.value);
        }
    }

    while (score > 21 && aceCount > 0) {
        score -= 10;
        aceCount--;
    }

    return score;
}

// --- 4. 카드 그래픽 UI 출력 함수 ---
function renderHands(hideDealerCard) {
    playerCardsElem.innerHTML = '';
    playerHand.forEach(card => { playerCardsElem.appendChild(createCardUI(card, false)); });
    playerScoreElem.innerText = calculateScore(playerHand);

    dealerCardsElem.innerHTML = '';
    dealerHand.forEach((card, index) => {
        if (hideDealerCard && index === 0) {
            dealerCardsElem.appendChild(createCardUI(card, true));
        } else {
            dealerCardsElem.appendChild(createCardUI(card, false));
        }
    });

    if (hideDealerCard) {
        dealerScoreElem.innerText = "?";
    } else {
        dealerScoreElem.innerText = calculateScore(dealerHand);
    }
}

function createCardUI(card, isBack) {
    const cardDiv = document.createElement('div');
    cardDiv.classList.add('card', card.suit);
    
    if (isBack) {
        cardDiv.classList.add('back');
    } else {
        cardDiv.innerHTML = `
            <div>${card.value}</div>
            <div style="align-self: center; font-size: 2rem;">${card.symbol}</div>
            <div style="transform: rotate(180deg);">${card.value}</div>
        `;
    }
    return cardDiv;
}

// --- 5. 게임 시작 함수 ---
function startGame() {
    // 🛟 예외처리: 배팅 유무 및 올인 파산 체크
    if (currentBet === 0) {
        gameMessageElem.innerText = "⚠️ 최소 $10 이상 배팅을 하셔야 게임을 시작할 수 있습니다!";
        return;
    }

    deck = shuffleDeck(createDeck());
    playerHand = [deck.pop(), deck.pop()];
    dealerHand = [deck.pop(), deck.pop()];
    isGameOver = false;

    // UI 상태 제어
    btnStart.disabled = true; // 게임 중엔 시작버튼 잠금
    btnHit.disabled = false;
    btnStand.disabled = false;
    gameMessageElem.innerText = "카드를 추가하려면 Hit, 멈추려면 Stand를 누르세요.";

    renderHands(true);

    // 내추럴 블랙잭(처음 두 장이 바로 21) 예외 처리
    if (calculateScore(playerHand) === 21) {
        stand();
    }
}

// --- 6. Hit ---
function hit() {
    if (isGameOver) return;

    playerHand.push(deck.pop());
    renderHands(true);

    const pScore = calculateScore(playerHand);
    if (pScore > 21) {
        endGame(`플레이어 버스트(21 초과)! 배팅금 $${currentBet}을 잃었습니다. ❌`, "lose");
    } else if (pScore === 21) {
        stand();
    }
}

// --- 7. Stand ---
function stand() {
    if (isGameOver) return;

    renderHands(false);
    let dealerScore = calculateScore(dealerHand);

    while (dealerScore < 17) {
        dealerHand.push(deck.pop());
        dealerScore = calculateScore(dealerHand);
    }

    renderHands(false);
    determineWinner();
}

// --- 8. 승패 결과 판정 및 상금 정산 ---
function determineWinner() {
    const pScore = calculateScore(playerHand);
    const dScore = calculateScore(dealerHand);

    if (dScore > 21) {
        endGame(`딜러 버스트! 플레이어 승리! +$${currentBet * 2} 획득! 🎉`, "win");
    } else if (pScore > dScore) {
        // 플레이어가 승리한 경우 (배팅액의 2배 환급)
        endGame(`축하합니다! 플레이어 승리! +$${currentBet * 2} 획득! 🏆`, "win");
    } else if (pScore < dScore) {
        endGame(`아쉽네요. 딜러가 승리했습니다. -$${currentBet} 회수 👤`, "lose");
    } else {
        // 비긴 경우 (배팅액 원금 전액 돌려받음)
        endGame(`비겼습니다! (Push) 배팅금 $${currentBet} 환불 🤝`, "push");
    }
}

// --- 9. 게임 종료 처리 및 자산 최신화 ---
function endGame(message, resultType) {
    isGameOver = true;
    btnHit.disabled = true;
    btnStand.disabled = true;
    btnStart.disabled = false; // 다시 시작 버튼 해제

    if (resultType === "win") {
        playerBalance += (currentBet * 2);
    } else if (resultType === "push") {
        playerBalance += currentBet;
    }
    // "lose"의 경우 이미 배팅할 때 잔액에서 차감되었으므로 추가 조치 없음

    currentBet = 0; // 배팅액 초기화
    updateFinanceUI();

    // 올인 상태에서 져서 전재산이 0원이 된 경우 구제책
    if (playerBalance === 0) {
        message += " [파산했습니다! 카지노에서 구제금 $500를 충전해 드립니다 🎁]";
        playerBalance = 500;
        updateFinanceUI();
    }

    gameMessageElem.innerText = message;
}
