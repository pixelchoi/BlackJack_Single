// --- 게임 상태 관리 변수 ---
let deck = [];
let playerHand = [];
let dealerHand = [];
let isGameOver = true;

// --- DOM 요소 연결 ---
const dealerCardsElem = document.getElementById('dealer-cards');
const playerCardsElem = document.getElementById('player-cards');
const dealerScoreElem = document.getElementById('dealer-score');
const playerScoreElem = document.getElementById('player-score');
const gameMessageElem = document.getElementById('game-message');

const btnStart = document.getElementById('btn-start');
const btnHit = document.getElementById('btn-hit');
const btnStand = document.getElementById('btn-stand');

// --- 이벤트 리스너 등록 ---
btnStart.addEventListener('click', startGame);
btnHit.addEventListener('click', hit);
btnStand.addEventListener('click', stand);

// --- 1. 카드 덱 생성 함수 ---
function createDeck() {
    const suits = ['spades', 'hearts', 'diamonds', 'clubs'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const symbols = { 'spades': '♠', 'hearts': '♥', 'diamonds': '♦', 'clubs': '♣' };
    
    let newDeck = [];
    for (let suit of suits) {
        for (let value of values) {
            newDeck.push({
                suit: suit,
                value: value,
                symbol: symbols[suit]
            });
        }
    }
    return newDeck;
}

// --- 2. 카드 셔플 함수 (Fisher-Yates 알고리즘) ---
function shuffleDeck(targetDeck) {
    for (let i = targetDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [targetDeck[i], targetDeck[j]] = [targetDeck[j], targetDeck[i]];
    }
    return targetDeck;
}

// --- 3. 점수 계산 함수 (Ace 예외 완벽 처리) ---
function calculateScore(hand) {
    let score = 0;
    let aceCount = 0;

    for (let card of hand) {
        if (card.value === 'A') {
            aceCount++;
            score += 11; // 일단 11점으로 처리
        } else if (['J', 'Q', 'K'].includes(card.value)) {
            score += 10;
        } else {
            score += parseInt(card.value);
        }
    }

    // 21점을 넘었을 때, Ace가 있다면 1점으로 전환
    while (score > 21 && aceCount > 0) {
        score -= 10;
        aceCount--;
    }

    return score;
}

// --- 4. 카드 그래픽 UI 출력 함수 ---
function renderHands(hideDealerCard) {
    // 플레이어 카드 렌더링
    playerCardsElem.innerHTML = '';
    playerHand.forEach(card => {
        playerCardsElem.appendChild(createCardUI(card, false));
    });
    playerScoreElem.innerText = calculateScore(playerHand);

    // 딜러 카드 렌더링
    dealerCardsElem.innerHTML = '';
    dealerHand.forEach((card, index) => {
        // 게임 진행 중이고 첫 번째 카드라면 뒷면 처리(Blackjack 표준 룰)
        if (hideDealerCard && index === 0) {
            dealerCardsElem.appendChild(createCardUI(card, true));
        } else {
            dealerCardsElem.appendChild(createCardUI(card, false));
        }
    });

    // 딜러 점수 표기 제어
    if (hideDealerCard) {
        dealerScoreElem.innerText = "?";
    } else {
        dealerScoreElem.innerText = calculateScore(dealerHand);
    }
}

// 개별 카드 DOM 생성기
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
    // 덱 세팅 및 초기화
    deck = shuffleDeck(createDeck());
    playerHand = [deck.pop(), deck.pop()];
    dealerHand = [deck.pop(), deck.pop()];
    isGameOver = false;

    // UI 상태 전환
    btnStart.innerText = "재경기";
    btnHit.disabled = false;
    btnStand.disabled = false;
    gameMessageElem.innerText = "카드를 더 받으시겠습니까?(Hit) 아니면 멈추시겠습니까?(Stand)";

    renderHands(true);

    // 시작하자마자 플레이어가 21점(블랙잭)인 경우 즉시 Stand 처리
    if (calculateScore(playerHand) === 21) {
        stand();
    }
}

// --- 6. Hit (카드 한 장 받기) ---
function hit() {
    if (isGameOver) return;

    playerHand.push(deck.pop());
    renderHands(true);

    const pScore = calculateScore(playerHand);
    if (pScore > 21) {
        endGame("플레이어 버스트(21 초과)! 딜러가 승리했습니다. ❌");
    } else if (pScore === 21) {
        stand(); // 21점 완성 시 자동으로 차례를 넘김
    }
}

// --- 7. Stand (그만 받기 & 딜러 AI 가동) ---
function stand() {
    if (isGameOver) return;

    // 딜러의 숨겨진 카드를 오픈하여 보여줌
    renderHands(false);

    let dealerScore = calculateScore(dealerHand);

    // 딜러 규칙: 점수가 17점 미만이면 무조건 계속 뽑아야 함
    while (dealerScore < 17) {
        dealerHand.push(deck.pop());
        dealerScore = calculateScore(dealerHand);
    }

    renderHands(false);
    determineWinner();
}

// --- 8. 승패 결과 판정 ---
function determineWinner() {
    const pScore = calculateScore(playerHand);
    const dScore = calculateScore(dealerHand);

    if (dScore > 21) {
        endGame("딜러 버스트! 플레이어가 승리했습니다! 🎉");
    } else if (pScore > dScore) {
        endGame("축하합니다! 플레이어가 이겼습니다! 🏆");
    } else if (pScore < dScore) {
        endGame("아쉽네요. 딜러가 승리했습니다. 👤");
    } else {
        endGame("비겼습니다! (Push) 🤝");
    }
}

// --- 9. 게임 종료 처리 ---
function endGame(message) {
    gameMessageElem.innerText = message;
    isGameOver = true;
    btnHit.disabled = true;
    btnStand.disabled = true;
}
