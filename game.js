// 羊羊消消乐 - 游戏逻辑

class YangGame {
    constructor() {
        // 卡片图案（用 emoji 表示）
        this.cardSymbols = ['🐑', '🌾', '✂️', '🧶', '🥕', '🍀', '🌸', '🍄'];
        
        // 游戏状态
        this.level = 1;
        this.score = 0;
        this.slot = [];
        this.slotMaxSize = 7;
        this.cardPool = [];
        
        // 道具数量
        this.undoCount = 3;
        this.shuffleCount = 3;
        this.removeCount = 3;
        
        // 历史记录（用于撤销）
        this.history = [];
        
        // 初始化
        this.init();
    }

    init() {
        this.createCardPool();
        this.renderCardPool();
        this.renderSlot();
        this.updateToolCounts();
        this.hideModal();
    }

    // 创建卡片池
    createCardPool() {
        this.cardPool = [];
        this.slot = [];
        this.history = [];
        
        // 每种卡片生成 3 的倍数张（确保可以完全消除）
        const cardsPerType = 9; // 每种 9 张，共 72 张卡片
        
        this.cardSymbols.forEach(symbol => {
            for (let i = 0; i < cardsPerType; i++) {
                this.cardPool.push({
                    id: Math.random().toString(36).substr(2, 9),
                    symbol: symbol,
                    matched: false
                });
            }
        });
        
        // 打乱卡片顺序
        this.shuffleArray(this.cardPool);
    }

    // 洗牌算法
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // 渲染卡片池 - 堆叠布局（类似羊了个羊）
    renderCardPool() {
        const poolEl = document.getElementById('cardPool');
        poolEl.innerHTML = '';
        
        const poolWidth = poolEl.clientWidth || 320;
        const poolHeight = poolEl.clientHeight || 420;
        const cardWidth = 50;
        const cardHeight = 58;
        
        // 将卡片分成 5-6 层，模拟原版的多层堆叠
        const layers = 6;
        const cardsPerLayer = Math.ceil(this.cardPool.length / layers);
        
        this.cardPool.forEach((card, index) => {
            if (!card.matched) {
                const cardEl = document.createElement('div');
                cardEl.className = 'card';
                cardEl.textContent = card.symbol;
                cardEl.dataset.id = card.id;
                
                // 计算层级
                const layer = Math.floor(index / cardsPerLayer);
                
                // 每层的基础偏移（向上堆叠）
                const layerOffsetX = layer * 3;
                const layerOffsetY = layer * 2;
                
                // 在层内按网格分布，但有轻微随机偏移
                const maxX = poolWidth - cardWidth - 20;
                const maxY = poolHeight - cardHeight - 20;
                
                // 使用确定性随机（基于索引），保证每次渲染位置一致
                const randomX = Math.sin(index * 13.7) * (maxX * 0.8);
                const randomY = Math.cos(index * 19.3) * (maxY * 0.8);
                
                const posX = 10 + Math.abs(randomX) + layerOffsetX;
                const posY = 10 + Math.abs(randomY) + layerOffsetY;
                
                cardEl.style.left = `${posX}px`;
                cardEl.style.top = `${posY}px`;
                cardEl.style.zIndex = index;
                
                // 添加点击事件
                cardEl.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.clickCard(card.id);
                }, false);
                
                cardEl.style.animationDelay = `${index * 0.012}s`;
                
                poolEl.appendChild(cardEl);
            }
        });
    }

    // 渲染槽位
    renderSlot() {
        const slotEl = document.getElementById('slot');
        slotEl.innerHTML = '';
        
        this.slot.forEach((card, index) => {
            const cardEl = document.createElement('div');
            cardEl.className = 'card slot-card';
            cardEl.textContent = card.symbol;
            cardEl.onclick = () => this.clickSlotCard(index);
            slotEl.appendChild(cardEl);
        });
    }

    // 点击卡片
    clickCard(cardId) {
        // 阻止默认行为和事件冒泡
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        
        const cardIndex = this.cardPool.findIndex(c => c.id === cardId);
        if (cardIndex === -1) return;
        
        const card = this.cardPool[cardIndex];
        
        // 检查槽位是否已满
        if (this.slot.length >= this.slotMaxSize) {
            this.showModal('游戏结束', '槽位已满，再试一次吧！😢');
            return;
        }
        
        // 保存到历史记录
        this.saveHistory();
        
        // 移动到槽位
        this.cardPool.splice(cardIndex, 1);
        this.slot.push(card);
        
        // 渲染
        this.renderCardPool();
        this.renderSlot();
        
        // 检查匹配
        this.checkMatch();
        
        // 检查胜利
        this.checkWin();
    }

    // 点击槽位中的卡片（撤销操作）
    clickSlotCard(index) {
        if (this.undoCount <= 0) {
            alert('撤销次数已用完！');
            return;
        }
        
        const card = this.slot[index];
        
        // 保存到历史记录
        this.saveHistory();
        
        // 移回卡片池
        this.slot.splice(index, 1);
        this.cardPool.push(card);
        
        // 渲染
        this.renderCardPool();
        this.renderSlot();
    }

    // 检查匹配
    checkMatch() {
        const symbolCount = {};
        
        // 统计每种图案的数量
        this.slot.forEach(card => {
            symbolCount[card.symbol] = (symbolCount[card.symbol] || 0) + 1;
        });
        
        // 找到可以消除的图案
        for (const symbol in symbolCount) {
            if (symbolCount[symbol] >= 3) {
                // 消除 3 张
                let removed = 0;
                this.slot = this.slot.filter(card => {
                    if (card.symbol === symbol && removed < 3) {
                        removed++;
                        return false;
                    }
                    return true;
                });
                
                // 更新分数
                this.score += removed * 10;
                this.updateScore();
                
                // 渲染
                this.renderSlot();
                this.renderCardPool();
                
                break;
            }
        }
    }

    // 检查胜利
    checkWin() {
        if (this.cardPool.length === 0 && this.slot.length === 0) {
            this.score += 100; // 通关奖励
            this.updateScore();
            this.showModal('🎉 恭喜通关！', `最终得分：${this.score} 分`);
        }
    }

    // 检查失败
    checkLoss() {
        if (this.slot.length >= this.slotMaxSize) {
            this.showModal('游戏结束', '槽位已满，再试一次吧！😢');
        }
    }

    // 撤销
    undo() {
        if (this.undoCount <= 0 || this.history.length === 0) {
            alert('没有可撤销的操作！');
            return;
        }
        
        this.undoCount--;
        this.updateToolCounts();
        
        const lastState = this.history.pop();
        this.cardPool = lastState.cardPool;
        this.slot = lastState.slot;
        
        this.renderCardPool();
        this.renderSlot();
    }

    // 洗牌
    shuffle() {
        if (this.shuffleCount <= 0) {
            alert('洗牌次数已用完！');
            return;
        }
        
        this.shuffleCount--;
        this.updateToolCounts();
        
        // 将槽位中的卡片移回卡片池
        this.cardPool.push(...this.slot);
        this.slot = [];
        
        // 打乱
        this.shuffleArray(this.cardPool);
        
        this.renderCardPool();
        this.renderSlot();
    }

    // 移除三张卡片
    removeThree() {
        if (this.removeCount <= 0) {
            alert('移除次数已用完！');
            return;
        }
        
        if (this.slot.length < 3) {
            alert('槽位中卡片不足 3 张！');
            return;
        }
        
        this.removeCount--;
        this.updateToolCounts();
        
        // 移除槽位中前 3 张卡片
        this.slot.splice(0, 3);
        
        this.renderSlot();
    }

    // 保存历史记录
    saveHistory() {
        this.history.push({
            cardPool: [...this.cardPool],
            slot: [...this.slot]
        });
        
        // 限制历史记录长度
        if (this.history.length > 10) {
            this.history.shift();
        }
    }

    // 更新分数显示
    updateScore() {
        document.getElementById('score').textContent = this.score;
    }

    // 更新道具计数
    updateToolCounts() {
        document.getElementById('undoCount').textContent = this.undoCount;
        document.getElementById('shuffleCount').textContent = this.shuffleCount;
        document.getElementById('removeCount').textContent = this.removeCount;
    }

    // 重新开始
    restart() {
        this.score = 0;
        this.undoCount = 3;
        this.shuffleCount = 3;
        this.removeCount = 3;
        this.updateScore();
        this.updateToolCounts();
        this.init();
    }

    // 显示弹窗
    showModal(title, message) {
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalMessage').textContent = message;
        document.getElementById('modal').classList.add('show');
    }

    // 隐藏弹窗
    hideModal() {
        document.getElementById('modal').classList.remove('show');
    }
}

// 启动游戏
const game = new YangGame();
