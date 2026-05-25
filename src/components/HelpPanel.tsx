import React from "react";

interface HelpPanelProps {
  visible: boolean;
  onClose: () => void;
}

export const HelpPanel: React.FC<HelpPanelProps> = ({ visible, onClose }) => {
  if (!visible) return null;

  return (
    <div className="help-overlay" onClick={onClose}>
      <div className="help-panel" onClick={(e) => e.stopPropagation()}>
        <button className="help-close" onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <h2 className="help-title">🎮 数独玩法说明书</h2>

        {/* ── 基本规则 ── */}
        <section className="help-section">
          <h3>📖 基本规则</h3>
          <p>数独是一种逻辑填数游戏，棋盘是一个 9×9 的网格，被粗线划分为 9 个 3×3 的宫。</p>
          <p><strong>目标：</strong>在空格中填入数字 1-9，使得：</p>
          <ul>
            <li>🔹 每一行包含 1-9 不重复</li>
            <li>🔹 每一列包含 1-9 不重复</li>
            <li>🔹 每一个 3×3 宫包含 1-9 不重复</li>
          </ul>
          <p>谜题初始会给出一些数字（灰色加粗），这些是<strong>原题</strong>，不可修改。你需要在其余空格中推理填入正确的数字。</p>
        </section>

        {/* ── 操作方式 ── */}
        <section className="help-section">
          <h3>🖱️ 操作方式</h3>

          <h4>鼠标操作</h4>
          <ul>
            <li><strong>选择格子：</strong>点击棋盘上的任意格子</li>
            <li><strong>填入数字：</strong>选中格子后，点击右侧数字键盘的 1-9</li>
            <li><strong>擦除数字：</strong>点击「擦除」按钮清空当前格</li>
            <li><strong>笔记模式：</strong>开启后点击数字，会在格子里标记候选数字（小字）</li>
          </ul>

          <h4>键盘操作</h4>
          <ul>
            <li><strong>数字键 1-9：</strong>填入数字</li>
            <li><strong>Backspace / Delete：</strong>擦除当前格</li>
            <li><strong>方向键 ↑↓←→：</strong>移动选中格</li>
            <li><strong>N：</strong>切换笔记模式</li>
            <li><strong>Ctrl+Z / ⌘Z：</strong>撤销上一步操作</li>
          </ul>
        </section>

        {/* ── 功能说明 ── */}
        <section className="help-section">
          <h3>✨ 功能说明</h3>

          <div className="help-feature">
            <h4>📌 同数高亮</h4>
            <p>选中一个数字后，棋盘上所有相同的数字都会以<em>浅黄色</em>高亮显示，帮助你快速扫描行列宫中的重复情况。</p>
          </div>

          <div className="help-feature">
            <h4>⚠️ 冲突检测</h4>
            <p>当你在同一行、列或宫中填入重复数字时，冲突的格子会以<em>红色</em>高亮，提醒你及时修正。</p>
          </div>

          <div className="help-feature">
            <h4>📝 笔记模式</h4>
            <p>点击右上角的开关（或按 N 键）进入笔记模式。在此模式下点击数字，不会直接填入，而是在格子里用<em>灰色小字</em>标记候选数字。再次点击同一数字可取消该候选。笔记模式非常适合使用候选数法解题时使用。</p>
          </div>

          <div className="help-feature">
            <h4>💡 提示</h4>
            <p>点击「提示」按钮，系统会自动找到一个空格（或错填的格子）并填入正确答案，格子会<em>绿色闪烁</em>提示你。</p>
          </div>

          <div className="help-feature">
            <h4>🔍 检查</h4>
            <p>点击「检查」按钮，系统会核对你所有已填数字是否正确。如有错误会高亮显示，并告知错误数量。</p>
          </div>

          <div className="help-feature">
            <h4>↩️ 撤销</h4>
            <p>点击「撤销」或按 Ctrl+Z，可回退到上一步操作。支持多步撤销。</p>
          </div>

          <div className="help-feature">
            <h4>🔄 重置</h4>
            <p>清空所有你填入的数字，只保留原题数字，计时器归零，重新开始挑战。</p>
          </div>

          <div className="help-feature">
            <h4>🎯 完成</h4>
            <p>当所有格子填满且无冲突时，游戏自动完成，计时停止，显示总用时。</p>
          </div>
        </section>

        {/* ── 难度说明 ── */}
        <section className="help-section">
          <h3>📊 难度说明</h3>
          <table className="help-table">
            <thead>
              <tr>
                <th>难度</th>
                <th>空格数</th>
                <th>说明</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>🌟 简单</td>
                <td>30-35</td>
                <td>仅需唯一余数 / 摒除法即可解出，适合新手入门</td>
              </tr>
              <tr>
                <td>🌟 中等</td>
                <td>36-45</td>
                <td>需要区块摒除 / 数对等技巧</td>
              </tr>
              <tr>
                <td>🔥 困难</td>
                <td>46-52</td>
                <td>需要 X-Wing / 链等高级技巧</td>
              </tr>
              <tr>
                <td>🔥 专家</td>
                <td>53-58</td>
                <td>需要多种高级技巧综合运用</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* ── 新手建议 ── */}
        <section className="help-section">
          <h3>💪 新手建议</h3>
          <ol>
            <li>从<strong>简单</strong>难度开始，熟悉基本操作</li>
            <li>先找只有一种可能的格子（唯一余数），最直观</li>
            <li>用好<strong>笔记模式</strong>记录候选数字，逐步推理</li>
            <li>遇到困难时可以点<strong>提示</strong>，学习解题思路</li>
            <li>用<strong>检查</strong>功能验证已填数字是否正确</li>
          </ol>
        </section>

        <p className="help-footer">祝你玩得开心！🧩</p>
      </div>
    </div>
  );
};
