// 羊羊消消乐 - 游戏逻辑（重构版）

class YangGame {
    constructor() {
        this.cardSymbols = ['🐑', '🌾', '✂️', '🧶', '🥕', '🍀', '🌸', '🍄'];
        this.level = 1;
        this.score = 0;
        this.slot = [];
        this.slotMaxSize = 7;
        this.cardPool = [];
        this.undoCount = 3;
        this.shuffleCount = 3;
        this.removeCount = 3;
        this.history = [];
        
        this.init();
    }

    init() {
        this.createCardPool();
        this.renderCardPool();
        this.renderSlot();
        this.updateToolCounts();
        this.hideModal();
        this.checkTutorial();
        this.bindGlobalEvents();
    }

    createCardPool() {
        this.cardPool = [];
        this.slot = [];
        this.history = [];
        
        const cardsPerType = 9;
        
        this.cardSymbols.forEach(symbol => {
            for (let i = 0; i < cardsPerType; i++) {
                this.cardPool.push({
                    id: Math.random().toString(36).substr(2, 9),
                    symbol: symbol,
                    matched: false
                });
            }
        });

        this.shuffleArray(this.cardPool);
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    renderCardPool() {
        const poolEl = document.getElementById('cardPool');
        poolEl.innerHTML = '';
        
        const poolWidth = poolEl.clientWidth || 340;
        const poolHeight = 450;
        const cardWidth = 50;
        const cardHeight = 58;
        
        // 简化：只分 3 层，确保有足够的卡片在最上层
        const layers = 3;
        const cardsPerLayer = Math.ceil(this.cardPool.length / layers);
        
        this.cardPool.forEach((card, index) => {
            if (!card.matched) {
                const cardEl = document.createElement('div');
                cardEl.className = 'card';
                cardEl.textContent = card.symbol;
                
                // 计算位置
                const layer = Math.floor(index / cardsPerLayer);
                const maxX = poolWidth - cardWidth - 40;
                const maxY = poolHeight - cardHeight - 40;
                
                // 每层有不同的分布模式
                const baseX = 20 + (index % 8) * (cardWidth + 6);
                const baseY = 20 + Math.floor(index / 8) * (cardHeight + 6);
                
                // 层偏移
                const offsetX = layer * 5;
                const offsetY = layer * 4;
                
                cardEl.style.left = `${baseX + offsetX}px`;
                cardEl.style.top = `${baseY + offsetY}px`;
                cardEl.style.zIndex = index;
                
                // 只有最后一层的卡片可以点击（最上层）
                const isTopLayer = (index >= this.cardPool.length - cardsPerLayer);
                
                if (isTopLayer) {
                    cardEl.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        this.clickCard(card.id);
                    });
                } else {
                    cardEl.style.opacity = '0.7';
                    cardEl.style.filter = 'brightness(0.8)';
                }
                
                cardEl.style.animationDelay = `${index * 0.015}s`;
                poolEl.appendChild(cardEl);
            }
        });
    }

    renderSlot() {
        const slotEl = document.getElementById('slot');
        slotEl.innerHTML = '';
        
        this.slot.forEach((card, index) => {
            const cardEl = document.createElement('div');
            cardEl.className = 'card slot-card';
            cardEl.textContent = card.symbol;
            slotEl.appendChild(cardEl);
        });
    }

    clickCard(cardId) {
        const cardIndex = this.cardPool.findIndex(c => c.id === cardId);
        if (cardIndex === -1) return;
        
        const card = this.cardPool[cardIndex];
        
        if (this.slot.length >= this.slotMaxSize) {
            this.showModal('游戏结束', '槽位已满，再试一次吧！😢');
            return;
        }
        
        this.saveHistory();
        this.cardPool.splice(cardIndex, 1);
        this.slot.push(card);
        
        this.renderCardPool();
        this.renderSlot();
        this.checkMatch();
        this.checkWin();
    }

    checkMatch() {
        const symbolCount = {};
        this.slot.forEach(card => {
            symbolCount[card.symbol] = (symbolCount[card.symbol] || 0) + 1;
        });

        for (const symbol in symbolCount) {
            if (symbolCount[symbol] >= 3) {
                let removed = 0;
                this.slot = this.slot.filter(card => {
                    if (card.symbol === symbol && removed < 3) {
                        removed++;
                        return false;
                    }
                    return true;
                });

                this.score += removed * 10;
                this.updateScore();
                this.renderSlot();
                this.renderCardPool();
                break;
            }
        }
    }

    checkWin() {
        if (this.cardPool.length === 0 && this.slot.length === 0) {
            this.score += 100;
            this.updateScore();
            this.showModal('🎉 恭喜通关！', `最终得分：${this.score} 分`);
        }
    }

    saveHistory() {
        this.history.push({
            cardPool: [...this.cardPool],
            slot: [...this.slot]
        });
        if (this.history.length > 10) {
            this.history.shift();
        }
    }

    updateScore() {
        document.getElementById('score').textContent = this.score;
    }

    updateToolCounts() {
        document.getElementById('undoCount').textContent = this.undoCount;
        document.getElementById('shuffleCount').textContent = this.shuffleCount;
        document.getElementById('removeCount').textContent = this.removeCount;
    }

    undo() {
        if (this.undoCount <= 0 || this.history.length === 0) {
            alert('没有可撤销的操作');
            return;
        }
        this.undoCount--;
        const lastState = this.history.pop();
        this.cardPool = lastState.cardPool;
        this.slot = lastState.slot;
        this.renderCardPool();
        this.renderSlot();
        this.updateToolCounts();
    }

    shuffle() {
        if (this.shuffleCount <= 0) {
            alert('洗牌次数已用完');
            return;
        }
        this.shuffleCount--;
        this.cardPool.push(...this.slot);
        this.slot = [];
        this.shuffleArray(this.cardPool);
        this.renderCardPool();
        this.renderSlot();
        this.updateToolCounts();
    }

    removeThree() {
        if (this.removeCount <= 0 || this.slot.length < 3) {
            alert('移除次数已用完或槽位不足 3 张');
            return;
        }
        this.removeCount--;
        this.slot.splice(0, 3);
        this.renderSlot();
        this.updateToolCounts();
    }

    restart() {
        this.score = 0;
        this.undoCount = 3;
        this.shuffleCount = 3;
        this.removeCount = 3;
        this.updateScore();
        this.updateToolCounts();
        this.init();
    }

    showModal(title, message) {
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalMessage').textContent = message;
        document.getElementById('modal').classList.add('show');
    }

    hideModal() {
        document.getElementById('modal').classList.remove('show');
    }

    closeTutorial() {
        const tutorial = document.getElementById('tutorial');
        if (tutorial) {
            tutorial.style.display = 'none';
        }
        localStorage.setItem('yangGameTutorial', 'completed');
    }

    checkTutorial() {
        const completed = localStorage.getItem('yangGameTutorial');
        if (!completed) {
            // 显示教程
        } else {
            const tutorial = document.getElementById('tutorial');
            if (tutorial) {
                tutorial.style.display = 'none';
            }
        }
    }

    bindGlobalEvents() {
        document.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        document.addEventListener('dblclick', (e) => {
            e.preventDefault();
        }, false);
    }
}

// 启动游戏
const game = new YangGame();
