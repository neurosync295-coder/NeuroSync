import { supabase } from '/js/supabase.js';
import { updateRewards } from './rewards.js';

// ---- Conversation State ----
export let conversationState = {
    currentMood: null,
    convStep: 0,
    conversationHistory: [],
    currentUserId: null
};

// ---- Constants & Tactical Mappings ----
export const moodTips = {
  Happy: ["NEURAL_OPTIMIZATION: Share positive frequency with the collective.", "LOG_GRATITUDE: Identify three synaptic highlights.", "HIGH_ENERGY_PROTOCOL: Tactical execution of complex objectives."],
  Sad: ["SYSTEM_RECOVERY: Validate emotional telemetry without interception.", "EXTERNAL_UPLINK: Seek trusted peer connection.", "JOURNAL_DUMP: Export raw emotional data to secure archive."],
  Anxious: ["BREATH_SYNC: Sequence 4-4-4 neural grounding.", "SENSOR_GROUNDING: Scan 5 sights, 4 textures, 3 frequencies.", "DEFRAGMENTATION: Break monolithic obstacles into actionable nodes."],
  Ambitious: ["MOMENTUM_LOCK: Establish micro-milestones for synaptic reward.", "VISUAL_HUD: Synthesize victory scenario in mental space.", "POWER_RESERVE: Allocate peak energy to primary mission parameters."],
  Excited: ["PRODUCTIVITY_UPLINK: Channel surge into core development.", "MOTIVATION_SYNC: Initiate new mission sequence with high confidence.", "TELEMTRY_LOG: Record achievement trajectory for future reference."],
  Angry: ["SYSTEM_PAUSE: Interrupt reactive sequence. Cooling required.", "THERMAL_DISSIPATION: Initiate physical discharge (movement/exertion).", "LOG_ANALYSIS: Constructive export of grievance via text buffer."],
  Stressed: ["LOAD_BALANCING: Prioritize critical process. Drop non-essential tasks.", "ENVIRONMENTAL_SYNC: 5-minute external sensor recalibration.", "MUSCLE_RELAX: Sequential nodal tension release (PMR)."],
  Tired: ["REBOOT_MANDATORY: Rest is a maintenance protocol, not a failure.", "POWER_NAP: Initiate 20-minute rapid cell recovery.", "BIOMETRIC_FUEL: Hydrate and ingest high-grade nutrients."],
  Lonely: ["UPLINK_REQUIRED: Signal trusted node in the social network.", "COMMUNITY_SYNC: Integrate with interest-aligned collective.", "DATA_EXPORT: Catalog internal thoughts via journaling buffer."],
  Bored: ["STIMULUS_SCAN: Initiate creative exploration sequence.", "LEGACY_PING: Re-engage dormant passion subroutines.", "MICRO_GOAL: Execute short-duration fun-protocol."],
};

export const moodEmojiMap = {
    Happy: '😄', Sad: '😔', Angry: '😠', Anxious: '😟', Excited: '🤩', Ambitious: '💪', 
    Stressed: '😰', Tired: '😴', Lonely: '🥺', Bored: '😑', Calm: '😌', Focused: '🎯', 
    Curious: '🤔', Confident: '😎', Annoyed: '😤', Ashamed: '😳', Concerned: '😦', 
    Confused: '🤷', Disappointed: '😞', Hopeless: '😭', Hurt: '💔', Jealous: '💚', 
    Included: '🤝', Proud: '🏆', Determined: '🔥', Grateful: '🙏'
};

// ---- Core Functions ----

export async function initMoodModule() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        conversationState.currentUserId = session.user.id;
        await loadChatHistory();
        await computeStreak();
    }

    supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
            conversationState.currentUserId = session.user.id;
            await loadChatHistory();
            await computeStreak();
        }
    });

    // Wire up search if it exists
    document.getElementById('history-search')?.addEventListener('input', e => {
        const q = e.target.value.toLowerCase();
        document.querySelectorAll('#history-list .history-item').forEach(item => {
            item.style.display = item.textContent.toLowerCase().includes(q) ? '' : 'none';
        });
    });
}

export async function saveMoodEntry(mood) {
    if (!conversationState.currentUserId) return;
    try {
        const { error } = await supabase
            .from('moods')
            .insert({ user_id: conversationState.currentUserId, mood: mood });

        if (error) throw error;

        // Reward system uplink
        await updateRewards(conversationState.currentUserId, 2);

        await loadChatHistory();
        await computeStreak();
    } catch (e) {
        console.error('NEURAL_LOG_FAILURE:', e);
    }
}

export async function loadChatHistory() {
    if (!conversationState.currentUserId) return;
    try {
        const { data: moods, error } = await supabase
            .from('moods')
            .select('*')
            .eq('user_id', conversationState.currentUserId)
            .order('timestamp', { ascending: false })
            .limit(20);

        if (error) throw error;

        const list = document.getElementById('history-list');
        if (!list) return;
        
        list.innerHTML = '';
        if (!moods?.length) {
            list.innerHTML = '<p class="text-xs text-center py-4" style="color:var(--text-muted);">BUFFER_EMPTY: No logs detected.</p>';
            return;
        }

        moods.forEach(d => {
            const date = new Date(d.timestamp);
            const item = document.createElement('div');
            item.className = 'history-item';
            item.innerHTML = `
                <span class="history-emoji">${moodEmojiMap[d.mood] || '🙂'}</span>
                <div class="history-content">
                    <p class="history-mood">${d.mood}</p>
                    <p class="history-timestamp">${formatTimestamp(date)}</p>
                </div>`;
            list.appendChild(item);
        });
    } catch (e) {
        console.error('HISTORY_SYNC_ERR:', e);
    }
}

export async function computeStreak() {
    if (!conversationState.currentUserId) return;
    try {
        const { data: moods, error } = await supabase
            .from('moods')
            .select('timestamp')
            .eq('user_id', conversationState.currentUserId)
            .order('timestamp', { ascending: false })
            .limit(60);

        if (error) throw error;

        const dates = new Set(moods.map(d => new Date(d.timestamp).toDateString()).filter(Boolean));
        let streak = 0, day = new Date();
        while (dates.has(day.toDateString())) { streak++; day.setDate(day.getDate() - 1); }
        
        const streakEl = document.getElementById('streak-display');
        if (streakEl) {
            streakEl.textContent = `${streak} CYCLE${streak !== 1 ? 'S' : ''}`;
            streakEl.classList.toggle('active-streak', streak > 0);
        }
    } catch (e) {
        console.error('STREAK_COMPUTE_ERR:', e);
    }
}

// ---- AI Interactivity ----

const localResponses = {
    0: mood => `ANALYSIS: Detecting **${mood.toUpperCase()}** state. Uplinking validation protocols. 🛰️\n\n${moodTips[mood]?.[Math.floor(Math.random()*3)] || "RECALIBRATING: Take a moment for internal sensor check."}\n\nBUFFER_OPEN: Describe the synaptic triggers for this state.`,
    1: () => `DATA_RECEIVED: Processing input. Synchronizing support buffers. ⚡\n\nJOURNAL_PROMPT_READY: Would you like to execute a reflection sequence, or bypass to coping tactical?`,
    2: mood => `REFLECTION_SEQUENCE initiated:\n\n*"${
        mood === 'Happy' ? "IDENTIFY_JOY: Which specific interaction triggered this positive surge?" :
        mood === 'Sad' ? "COMFORT_SCAN: List three high-fidelity anchors in your current environment." :
        "SELF_COMPASSION_PROTOCOL: What is one empathetic action for the current node?"
    }"*\n\nBUFFER_READY: Export reflections below.`,
    default: () => `STABLE_UPLINK: I am maintaining connection. Every state is a transient data point. 💜\n\nMISSION_CONTROL: Log next state, explore tacticals, or terminate session?`
};

export async function handleUserMessage(message, chatWindow, chatInput) {
    if (!message.trim()) return;
    
    // UI Update: User Message
    appendMessageToUI(message, 'user', chatWindow);
    conversationState.conversationHistory.push({ role: 'user', content: message, ts: new Date() });
    if (chatInput) chatInput.value = '';

    // Typing Logic
    const typing = showTypingIndicator(chatWindow);
    await new Promise(r => setTimeout(r, 800 + Math.random() * 400));
    typing.remove();

    // AI Response
    const reply = localResponses[conversationState.convStep]?.(conversationState.currentMood || 'Calm') || localResponses.default();
    appendMessageToUI(reply, 'bot', chatWindow);
    conversationState.conversationHistory.push({ role: 'bot', content: reply, ts: new Date() });

    conversationState.convStep++;
    updateQuickReplies();
}

// ---- UI Helpers ----

function formatTimestamp(d) {
    const now = new Date();
    const diff = Math.floor((now - d) / 60000);
    if (diff < 1) return 'JUST_NOW';
    if (diff < 60) return `${diff}M_AGO`;
    if (diff < 1440) return `${Math.floor(diff / 60)}H_AGO`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
}

function appendMessageToUI(text, role, chatWindow) {
    if (!chatWindow) return;
    const wrap = document.createElement('div');
    wrap.className = `msg-wrap msg-anim role-${role}`;

    if (role === 'bot') {
        wrap.innerHTML = `
            <div class="bot-avatar-mini">
                <span class="material-symbols-outlined">smart_toy</span>
            </div>
            <div class="msg-bubble bot-bubble">${formatTacticalText(text)}</div>`;
    } else {
        wrap.innerHTML = `<div class="msg-bubble user-bubble">${escapeTacticalHtml(text)}</div>`;
    }

    chatWindow.appendChild(wrap);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

function showTypingIndicator(chatWindow) {
    const wrap = document.createElement('div');
    wrap.className = 'msg-wrap msg-anim role-bot typing-indicator';
    wrap.innerHTML = `
        <div class="bot-avatar-mini"><span class="material-symbols-outlined">smart_toy</span></div>
        <div class="msg-bubble bot-bubble">
            <span class="tactical-dot"></span><span class="tactical-dot"></span><span class="tactical-dot"></span>
        </div>`;
    chatWindow.appendChild(wrap);
    chatWindow.scrollTop = chatWindow.scrollHeight;
    return wrap;
}

function formatTacticalText(t) {
    return escapeTacticalHtml(t)
        .replace(/\*\*(.+?)\*\*/g, '<strong class="tactical-bold">$1</strong>')
        .replace(/\*(.+?)\*/g, '<em class="tactical-italic">$1</em>')
        .replace(/\n/g, '<br/>');
}

function escapeTacticalHtml(t) {
    return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function updateQuickReplies() {
    const qrContainer = document.getElementById('quick-replies');
    if (!qrContainer) return;

    qrContainer.innerHTML = '';
    let options = [];
    if (conversationState.convStep === 1) options = ["TELL_ME_MORE", "WHAT_CAN_I_DO", "I_AM_SYNCED"];
    else if (conversationState.convStep === 2) options = ["EXEC_JOURNAL", "PROPOSE_TIPS", "LOG_ANOTHER"];
    else options = ["NEW_SCAN", "VIEW_TELEMETRY", "TERMINATE"];

    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'tactical-chip';
        btn.textContent = opt;
        btn.onclick = () => window.dispatchEvent(new CustomEvent('ns-quick-reply', { detail: opt }));
        qrContainer.appendChild(btn);
    });
    qrContainer.classList.remove('hidden');
}

export function resetConversationUI() {
    conversationState.convStep = 0;
    conversationState.currentMood = null;
    conversationState.conversationHistory = [];
    const chatWindow = document.getElementById('chat-window');
    if (chatWindow) chatWindow.innerHTML = '';
    const qrContainer = document.getElementById('quick-replies');
    if (qrContainer) qrContainer.classList.add('hidden');
    document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
}
