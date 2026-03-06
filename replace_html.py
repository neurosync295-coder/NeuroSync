import os

filepath = 'c:\\Users\\Admin\\Documents\\Projects\\Project - NeuroSync\\html\\mood-selection.html'

with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# The section starts at line 184 and ends around 388 (inclusive).
# Let's find exactly by content:
start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if '<!-- Mood Selection Section -->' in line:
        start_idx = i
    if '<script>' in line and 'Firebase Configuration' in lines[i+1]:
        end_idx = i
        break

if start_idx != -1 and end_idx != -1:
    new_html = r'''  <!-- Mood Selection Section (AI Chat Layout) -->
  <main class="ai-chat-layout">
    <!-- Sidebar for Chat History -->
    <aside class="chat-sidebar border-r border-solid border-primary" id="chat-sidebar">
      <div class="sidebar-header">
        <h2 class="sidebar-title">
          <span class="material-symbols-outlined text-primary">history</span>
          History
        </h2>
        <button id="close-sidebar-btn" class="sidebar-close-btn xl:hidden translucent-button">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <div class="sidebar-content-scroll">
          <button id="new-chat-btn" class="sidebar-action-btn primary-gradient-btn mt-4 mx-4">
            <span class="material-symbols-outlined">add_comment</span>
            New Mood Chat
          </button>

          <!-- Mood Streak integrated into sidebar -->
          <div class="sidebar-streak glass-card mx-4 mt-4 p-4 rounded-xl border border-primary/30">
            <div class="flex items-center gap-3">
                <span class="text-2xl">🔥</span>
                <div class="flex flex-col">
                <span class="text-xs text-secondary">Current Streak</span>
                <span id="streak-count" class="font-bold text-lg text-primary">0 days</span>
                </div>
            </div>
          </div>

          <!-- Compact Search -->
          <div class="sidebar-search mx-4 mt-4">
            <div class="search-input-wrapper glass-element flex items-center p-2 rounded-full border border-primary/30">
              <span class="material-symbols-outlined text-secondary ml-2">search</span>
              <input type="text" id="mood-search" class="bg-transparent border-none text-white outline-none ml-2 w-full text-sm" placeholder="Search moods..." autocomplete="off">
            </div>
          </div>

          <div class="history-list-container mt-4 flex-grow px-4 overflow-y-auto">
            <div id="mood-history-list" class="flex flex-col gap-2">
                <!-- Items injected by JS -->
            </div>
          </div>
      </div>
      
      <!-- Hidden elements for JS compatibility -->
      <div id="mood-history-section" style="display: none;"></div>
      <button id="back-to-mood-btn" style="display: none;"></button>
      <button id="refresh-data-btn" style="display: none;"></button>
      <button id="export-data-btn" style="display: none;"></button>
      <div id="mood-insights" style="display: none;"></div>
    </aside>

    <!-- Main Chat Area -->
    <section class="chat-main">
      <header class="chat-header glass-element z-10 flex justify-between items-center p-4 border-b border-primary/30">
        <div class="flex items-center gap-3">
            <button class="mobile-sidebar-toggle translucent-button p-2 rounded-lg" id="mobile-sidebar-toggle">
            <span class="material-symbols-outlined">menu_open</span>
            </button>
            <div class="chat-header-info flex items-center gap-3">
                <div class="ai-avatar pulse-ring bg-primary/20 p-2 rounded-full">
                    <img src="../assets/favicon.png" class="w-8 h-8 object-contain" alt="NeuroSync AI">
                </div>
                <div class="flex flex-col">
                    <h2 class="text-lg font-bold text-white m-0">NeuroSync Assistant</h2>
                    <span class="text-xs text-secondary flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-green-500"></span> Online</span>
                </div>
            </div>
        </div>
        <div class="chat-actions">
           <button class="translucent-button p-2 rounded-full hover:bg-primary/20 transition-colors" title="Settings">
             <span class="material-symbols-outlined text-white">more_vert</span>
           </button>
        </div>
      </header>

      <div id="chat-window" class="chat-window-scroll flex-grow overflow-y-auto p-4 flex flex-col gap-4">
         <!-- Chat messages injected by JS -->
      </div>
      
      <!-- Quick Replies Container -->
      <div id="quick-replies" class="quick-replies-container flex flex-wrap justify-center gap-2 p-2" style="display: none;"></div>
      
      <!-- Integrated Mood Selector & Chat Input -->
      <div class="chat-input-area glass-card up-shadow p-4 border-t border-primary/30">
        
        <!-- Filter Tabs for Moods -->
        <div class="mood-categories-header flex justify-between items-center mb-2">
            <div class="mood-filters flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                <button class="filter-tab active px-4 py-1.5 rounded-full text-sm border-none bg-primary text-white font-medium" data-filter="all">All</button>
                <button class="filter-tab px-4 py-1.5 rounded-full text-sm border border-primary/50 text-secondary bg-transparent hover:bg-primary/20 transition-colors" data-filter="positive">Positive</button>
                <button class="filter-tab px-4 py-1.5 rounded-full text-sm border border-primary/50 text-secondary bg-transparent hover:bg-primary/20 transition-colors" data-filter="negative">Negative</button>
                <button class="filter-tab px-4 py-1.5 rounded-full text-sm border border-primary/50 text-secondary bg-transparent hover:bg-primary/20 transition-colors" data-filter="neutral">Neutral</button>
            </div>
            <button class="toggle-moods-btn text-secondary hover:text-white transition-colors" id="toggle-moods-btn" title="Toggle Mood Grid">
                <span class="material-symbols-outlined">expand_more</span>
            </button>
        </div>

        <!-- Mood Selector Strip (Horizontal Scroll) -->
        <div class="mood-grid-container max-h-32 overflow-y-auto overflow-x-hidden mb-3 hide-scrollbar" id="mood-grid-container">
          <div class="mood-grid grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            <!-- Positive Moods -->
            <button class="mood-button chatbot-mood-btn p-2 rounded-xl border border-primary/30 bg-secondary/30 hover:bg-primary/20 transition-all hover:-translate-y-1 hover:shadow-[0_4px_12px_rgba(147,51,234,0.3)] flex justify-center items-center aspect-square" data-mood="Ambitious" data-category="positive"><img src="../assets/images/Emotional/Ambitious.png" class="w-8 h-8 object-contain" alt="Ambitious" title="Ambitious" /></button>
            <button class="mood-button chatbot-mood-btn p-2 rounded-xl border border-primary/30 bg-secondary/30 hover:bg-primary/20 transition-all hover:-translate-y-1 hover:shadow-[0_4px_12px_rgba(147,51,234,0.3)] flex justify-center items-center aspect-square" data-mood="Calm" data-category="positive"><img src="../assets/images/Emotional/Calm.png" class="w-8 h-8 object-contain" alt="Calm" title="Calm" /></button>
            <button class="mood-button chatbot-mood-btn p-2 rounded-xl border border-primary/30 bg-secondary/30 hover:bg-primary/20 transition-all hover:-translate-y-1 hover:shadow-[0_4px_12px_rgba(147,51,234,0.3)] flex justify-center items-center aspect-square" data-mood="Confident" data-category="positive"><img src="../assets/images/Emotional/Confident.png" class="w-8 h-8 object-contain" alt="Confident" title="Confident" /></button>
            <button class="mood-button chatbot-mood-btn p-2 rounded-xl border border-primary/30 bg-secondary/30 hover:bg-primary/20 transition-all hover:-translate-y-1 hover:shadow-[0_4px_12px_rgba(147,51,234,0.3)] flex justify-center items-center aspect-square" data-mood="Curious" data-category="positive"><img src="../assets/images/Emotional/Curious.png" class="w-8 h-8 object-contain" alt="Curious" title="Curious" /></button>
            <button class="mood-button chatbot-mood-btn p-2 rounded-xl border border-primary/30 bg-secondary/30 hover:bg-primary/20 transition-all hover:-translate-y-1 hover:shadow-[0_4px_12px_rgba(147,51,234,0.3)] flex justify-center items-center aspect-square" data-mood="Determined" data-category="positive"><img src="../assets/images/Emotional/Determined.png" class="w-8 h-8 object-contain" alt="Determined" title="Determined" /></button>
            <button class="mood-button chatbot-mood-btn p-2 rounded-xl border border-primary/30 bg-secondary/30 hover:bg-primary/20 transition-all hover:-translate-y-1 hover:shadow-[0_4px_12px_rgba(147,51,234,0.3)] flex justify-center items-center aspect-square" data-mood="Excited" data-category="positive"><img src="../assets/images/Emotional/Excited.png" class="w-8 h-8 object-contain" alt="Excited" title="Excited" /></button>
            <button class="mood-button chatbot-mood-btn p-2 rounded-xl border border-primary/30 bg-secondary/30 hover:bg-primary/20 transition-all hover:-translate-y-1 hover:shadow-[0_4px_12px_rgba(147,51,234,0.3)] flex justify-center items-center aspect-square" data-mood="Focused" data-category="positive"><img src="../assets/images/Emotional/Focused.png" class="w-8 h-8 object-contain" alt="Focused" title="Focused" /></button>
            <button class="mood-button chatbot-mood-btn p-2 rounded-xl border border-primary/30 bg-secondary/30 hover:bg-primary/20 transition-all hover:-translate-y-1 hover:shadow-[0_4px_12px_rgba(147,51,234,0.3)] flex justify-center items-center aspect-square" data-mood="Greatful" data-category="positive"><img src="../assets/images/Emotional/Greatful.png" class="w-8 h-8 object-contain" alt="Greatful" title="Greatful" /></button>
            <button class="mood-button chatbot-mood-btn p-2 rounded-xl border border-primary/30 bg-secondary/30 hover:bg-primary/20 transition-all hover:-translate-y-1 hover:shadow-[0_4px_12px_rgba(147,51,234,0.3)] flex justify-center items-center aspect-square" data-mood="Happy" data-category="positive"><img src="../assets/images/Emotional/Happy.png" class="w-8 h-8 object-contain" alt="Happy" title="Happy" /></button>
            <button class="mood-button chatbot-mood-btn p-2 rounded-xl border border-primary/30 bg-secondary/30 hover:bg-primary/20 transition-all hover:-translate-y-1 hover:shadow-[0_4px_12px_rgba(147,51,234,0.3)] flex justify-center items-center aspect-square" data-mood="Included" data-category="positive"><img src="../assets/images/Emotional/Included.png" class="w-8 h-8 object-contain" alt="Included" title="Included" /></button>
            <button class="mood-button chatbot-mood-btn p-2 rounded-xl border border-primary/30 bg-secondary/30 hover:bg-primary/20 transition-all hover:-translate-y-1 hover:shadow-[0_4px_12px_rgba(147,51,234,0.3)] flex justify-center items-center aspect-square" data-mood="Proud" data-category="positive"><img src="../assets/images/Emotional/Proud.png" class="w-8 h-8 object-contain" alt="Proud" title="Proud" /></button>
            <!-- Negative Moods -->
            <button class="mood-button chatbot-mood-btn p-2 rounded-xl border border-primary/30 bg-secondary/30 hover:bg-primary/20 transition-all hover:-translate-y-1 hover:shadow-[0_4px_12px_rgba(147,51,234,0.3)] flex justify-center items-center aspect-square" data-mood="Angry" data-category="negative"><img src="../assets/images/Emotional/Angry.png" class="w-8 h-8 object-contain" alt="Angry" title="Angry" /></button>
            <button class="mood-button chatbot-mood-btn p-2 rounded-xl border border-primary/30 bg-secondary/30 hover:bg-primary/20 transition-all hover:-translate-y-1 hover:shadow-[0_4px_12px_rgba(147,51,234,0.3)] flex justify-center items-center aspect-square" data-mood="Annoyed" data-category="negative"><img src="../assets/images/Emotional/Annoyed.png" class="w-8 h-8 object-contain" alt="Annoyed" title="Annoyed" /></button>
            <button class="mood-button chatbot-mood-btn p-2 rounded-xl border border-primary/30 bg-secondary/30 hover:bg-primary/20 transition-all hover:-translate-y-1 hover:shadow-[0_4px_12px_rgba(147,51,234,0.3)] flex justify-center items-center aspect-square" data-mood="Anxious" data-category="negative"><img src="../assets/images/Emotional/Anxious.png" class="w-8 h-8 object-contain" alt="Anxious" title="Anxious" /></button>
            <button class="mood-button chatbot-mood-btn p-2 rounded-xl border border-primary/30 bg-secondary/30 hover:bg-primary/20 transition-all hover:-translate-y-1 hover:shadow-[0_4px_12px_rgba(147,51,234,0.3)] flex justify-center items-center aspect-square" data-mood="Ashamed" data-category="negative"><img src="../assets/images/Emotional/Ashamed.png" class="w-8 h-8 object-contain" alt="Ashamed" title="Ashamed" /></button>
            <button class="mood-button chatbot-mood-btn p-2 rounded-xl border border-primary/30 bg-secondary/30 hover:bg-primary/20 transition-all hover:-translate-y-1 hover:shadow-[0_4px_12px_rgba(147,51,234,0.3)] flex justify-center items-center aspect-square" data-mood="Bored" data-category="negative"><img src="../assets/images/Emotional/Bored.png" class="w-8 h-8 object-contain" alt="Bored" title="Bored" /></button>
            <button class="mood-button chatbot-mood-btn p-2 rounded-xl border border-primary/30 bg-secondary/30 hover:bg-primary/20 transition-all hover:-translate-y-1 hover:shadow-[0_4px_12px_rgba(147,51,234,0.3)] flex justify-center items-center aspect-square" data-mood="Concerned" data-category="negative"><img src="../assets/images/Emotional/Concerned.png" class="w-8 h-8 object-contain" alt="Concerned" title="Concerned" /></button>
            <button class="mood-button chatbot-mood-btn p-2 rounded-xl border border-primary/30 bg-secondary/30 hover:bg-primary/20 transition-all hover:-translate-y-1 hover:shadow-[0_4px_12px_rgba(147,51,234,0.3)] flex justify-center items-center aspect-square" data-mood="Confused" data-category="negative"><img src="../assets/images/Emotional/Confused.png" class="w-8 h-8 object-contain" alt="Confused" title="Confused" /></button>
            <button class="mood-button chatbot-mood-btn p-2 rounded-xl border border-primary/30 bg-secondary/30 hover:bg-primary/20 transition-all hover:-translate-y-1 hover:shadow-[0_4px_12px_rgba(147,51,234,0.3)] flex justify-center items-center aspect-square" data-mood="Disappointed" data-category="negative"><img src="../assets/images/Emotional/Disappointed.png" class="w-8 h-8 object-contain" alt="Disappointed" title="Disappointed" /></button>
            <button class="mood-button chatbot-mood-btn p-2 rounded-xl border border-primary/30 bg-secondary/30 hover:bg-primary/20 transition-all hover:-translate-y-1 hover:shadow-[0_4px_12px_rgba(147,51,234,0.3)] flex justify-center items-center aspect-square" data-mood="Hopeless" data-category="negative"><img src="../assets/images/Emotional/Hopeless.png" class="w-8 h-8 object-contain" alt="Hopeless" title="Hopeless" /></button>
            <button class="mood-button chatbot-mood-btn p-2 rounded-xl border border-primary/30 bg-secondary/30 hover:bg-primary/20 transition-all hover:-translate-y-1 hover:shadow-[0_4px_12px_rgba(147,51,234,0.3)] flex justify-center items-center aspect-square" data-mood="Hurt" data-category="negative"><img src="../assets/images/Emotional/Hurt.png" class="w-8 h-8 object-contain" alt="Hurt" title="Hurt" /></button>
            <button class="mood-button chatbot-mood-btn p-2 rounded-xl border border-primary/30 bg-secondary/30 hover:bg-primary/20 transition-all hover:-translate-y-1 hover:shadow-[0_4px_12px_rgba(147,51,234,0.3)] flex justify-center items-center aspect-square" data-mood="Jealous" data-category="negative"><img src="../assets/images/Emotional/Jealous.png" class="w-8 h-8 object-contain" alt="Jealous" title="Jealous" /></button>
            <button class="mood-button chatbot-mood-btn p-2 rounded-xl border border-primary/30 bg-secondary/30 hover:bg-primary/20 transition-all hover:-translate-y-1 hover:shadow-[0_4px_12px_rgba(147,51,234,0.3)] flex justify-center items-center aspect-square" data-mood="Lonely" data-category="negative"><img src="../assets/images/Emotional/Lonely.png" class="w-8 h-8 object-contain" alt="Lonely" title="Lonely" /></button>
            <button class="mood-button chatbot-mood-btn p-2 rounded-xl border border-primary/30 bg-secondary/30 hover:bg-primary/20 transition-all hover:-translate-y-1 hover:shadow-[0_4px_12px_rgba(147,51,234,0.3)] flex justify-center items-center aspect-square" data-mood="Stressed" data-category="negative"><img src="../assets/images/Emotional/Stressed.png" class="w-8 h-8 object-contain" alt="Stressed" title="Stressed" /></button>
            <button class="mood-button chatbot-mood-btn p-2 rounded-xl border border-primary/30 bg-secondary/30 hover:bg-primary/20 transition-all hover:-translate-y-1 hover:shadow-[0_4px_12px_rgba(147,51,234,0.3)] flex justify-center items-center aspect-square" data-mood="Tired" data-category="negative"><img src="../assets/images/Emotional/Tired.png" class="w-8 h-8 object-contain" alt="Tired" title="Tired" /></button>
            <!-- Neutral Moods -->
            <button class="mood-button chatbot-mood-btn p-2 rounded-xl border border-primary/30 bg-secondary/30 hover:bg-primary/20 transition-all hover:-translate-y-1 hover:shadow-[0_4px_12px_rgba(147,51,234,0.3)] flex justify-center items-center aspect-square" data-mood="Neutral" data-category="neutral"><img src="../assets/images/Emotional/Neutral.png" class="w-8 h-8 object-contain" alt="Neutral" title="Neutral" /></button>
            <button class="mood-button chatbot-mood-btn p-2 rounded-xl border border-primary/30 bg-secondary/30 hover:bg-primary/20 transition-all hover:-translate-y-1 hover:shadow-[0_4px_12px_rgba(147,51,234,0.3)] flex justify-center items-center aspect-square" data-mood="Okay" data-category="neutral"><img src="../assets/images/Emotional/Okay.png" class="w-8 h-8 object-contain" alt="Okay" title="Okay" /></button>
            <button class="mood-button chatbot-mood-btn p-2 rounded-xl border border-primary/30 bg-secondary/30 hover:bg-primary/20 transition-all hover:-translate-y-1 hover:shadow-[0_4px_12px_rgba(147,51,234,0.3)] flex justify-center items-center aspect-square" data-mood="Indifferent" data-category="neutral"><img src="../assets/images/Emotional/Indifferent.png" class="w-8 h-8 object-contain" alt="Indifferent" title="Indifferent" /></button>
            <button class="mood-button chatbot-mood-btn p-2 rounded-xl border border-primary/30 bg-secondary/30 hover:bg-primary/20 transition-all hover:-translate-y-1 hover:shadow-[0_4px_12px_rgba(147,51,234,0.3)] flex justify-center items-center aspect-square" data-mood="Content" data-category="neutral"><img src="../assets/images/Emotional/Content.png" class="w-8 h-8 object-contain" alt="Content" title="Content" /></button>
          </div>
        </div>

        <form id="chat-form" class="chat-input-form relative">
          <div class="chat-input-wrapper flex items-center bg-[#1A1122] rounded-full border border-primary/40 focus-within:border-primary focus-within:shadow-[0_0_15px_rgba(147,51,234,0.3)] transition-all p-1">
            <button type="button" class="attachment-btn p-2 text-secondary hover:text-primary transition-colors hover:bg-white/5 rounded-full" title="Add Details">
               <span class="material-symbols-outlined">add_circle</span>
            </button>
            <input type="text" id="chat-input" class="flex-grow bg-transparent border-none text-white outline-none px-2 text-sm md:text-base py-2" placeholder="Message NeuroSync AI..." autocomplete="off">
            <button type="submit" class="send-btn bg-primary hover:bg-primary/80 text-white rounded-full p-2 w-10 h-10 flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed">
               <span class="material-symbols-outlined text-sm">send</span>
            </button>
          </div>
        </form>
      </div>
    </section>
  </main>
'''
    new_lines = lines[:start_idx] + [new_html + '\n'] + lines[end_idx:]
    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    print(f"Replaced lines {start_idx} to {end_idx}")
else:
    print(f"Could not find markers! start_idx: {start_idx}, end_idx: {end_idx}")
