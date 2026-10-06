/**
 * Mascot "Zenny" — The friendly fluffy star-guardian of SUNFZENITH
 * Moods: 'happy' | 'sleepy' | 'lost'
 */

export function MascotZenny({ mood = 'happy', size = 160, className = '' } = {}) {
  let eyes = '';
  let mouth = '';
  let badge = '';

  if (mood === 'sleepy') {
    // Closed happy sleeping eyes
    eyes = `
      <path d="M48 64Q56 70 64 64" stroke="#16203D" stroke-width="3.5" stroke-linecap="round" fill="none"/>
      <path d="M96 64Q104 70 112 64" stroke="#16203D" stroke-width="3.5" stroke-linecap="round" fill="none"/>
      <text x="120" y="45" font-family="sans-serif" font-size="14" font-weight="bold" fill="#FBBF24">Zzz...</text>
    `;
    mouth = `<path d="M76 78Q80 82 84 78" stroke="#FF7B90" stroke-width="3" stroke-linecap="round" fill="none"/>`;
  } else if (mood === 'lost') {
    // Swirly/surprised lost eyes for 404
    eyes = `
      <circle cx="56" cy="62" r="7" fill="#16203D"/>
      <circle cx="54" cy="60" r="2.5" fill="#FFF"/>
      <circle cx="104" cy="62" r="7" fill="#16203D"/>
      <circle cx="102" cy="60" r="2.5" fill="#FFF"/>
    `;
    mouth = `<ellipse cx="80" cy="78" rx="5" ry="7" fill="#FF7B90"/>`;
    badge = `
      <g transform="translate(110, 15) rotate(15)">
        <polygon points="10,0 13,7 20,7 15,12 17,19 10,15 3,19 5,12 0,7 7,7" fill="#FBBF24"/>
      </g>
    `;
  } else {
    // Joyful, sparkling eyes & smile
    eyes = `
      <ellipse cx="56" cy="62" rx="7" ry="9" fill="#16203D"/>
      <circle cx="53" cy="58" r="3" fill="#FFF"/>
      <circle cx="58" cy="66" r="1.5" fill="#FFF"/>
      
      <ellipse cx="104" cy="62" rx="7" ry="9" fill="#16203D"/>
      <circle cx="101" cy="58" r="3" fill="#FFF"/>
      <circle cx="106" cy="66" r="1.5" fill="#FFF"/>
    `;
    mouth = `
      <path d="M72 74Q80 86 88 74" fill="#FF7B90"/>
      <path d="M70 73Q80 84 90 73" stroke="#16203D" stroke-width="2.5" stroke-linecap="round" fill="none"/>
    `;
  }

  return `
    <div class="mascot-container ${className}" style="width: ${size}px; height: ${size}px; display: inline-block;">
      <svg viewBox="0 0 160 160" width="100%" height="100%">
        <!-- Soft Outer Glow -->
        <circle cx="80" cy="80" r="74" fill="#E6F2FF" opacity="0.6"/>
        
        <!-- Fluffy Ears -->
        <path d="M35 55Q25 15 65 35Z" fill="#FFFDF8" stroke="#E2E7F0" stroke-width="2"/>
        <path d="M40 50Q35 25 60 38Z" fill="#FFE1D6" opacity="0.8"/>
        
        <path d="M125 55Q135 15 95 35Z" fill="#FFFDF8" stroke="#E2E7F0" stroke-width="2"/>
        <path d="M120 50Q125 25 100 38Z" fill="#FFE1D6" opacity="0.8"/>

        <!-- Cloud Body / Head -->
        <ellipse cx="80" cy="82" rx="56" ry="50" fill="#FFFDF8" stroke="#E2E7F0" stroke-width="2.5"/>
        
        <!-- Fluffy Hair Tufts -->
        <path d="M70 34Q80 20 90 34Q98 26 95 40" stroke="#E2E7F0" stroke-width="2.5" fill="#FFFDF8"/>

        <!-- Golden Star Hair Clip -->
        <g transform="translate(100, 38) rotate(12)">
          <polygon points="8,0 10,6 16,6 11,10 13,16 8,12 3,16 5,10 0,6 6,6" fill="#FBBF24" stroke="#F59E0B" stroke-width="1"/>
        </g>

        <!-- Cute Blushing Cheeks -->
        <ellipse cx="44" cy="72" rx="8" ry="4.5" fill="#FFB8C6" opacity="0.65"/>
        <ellipse cx="116" cy="72" rx="8" ry="4.5" fill="#FFB8C6" opacity="0.65"/>

        <!-- Eyes and Mouth -->
        ${eyes}
        ${mouth}
        ${badge}

        <!-- Little Sun Buddy Plushie on Shoulder -->
        <g transform="translate(18, 92) rotate(-8)">
          <circle cx="20" cy="20" r="14" fill="#FBBF24"/>
          <!-- Sun Rays -->
          <circle cx="20" cy="2" r="2.5" fill="#F59E0B"/>
          <circle cx="20" cy="38" r="2.5" fill="#F59E0B"/>
          <circle cx="2" cy="20" r="2.5" fill="#F59E0B"/>
          <circle cx="38" cy="20" r="2.5" fill="#F59E0B"/>
          <circle cx="7" cy="7" r="2" fill="#F59E0B"/>
          <circle cx="33" cy="33" r="2" fill="#F59E0B"/>
          <!-- Buddy Face -->
          <circle cx="16" cy="18" r="1.5" fill="#16203D"/>
          <circle cx="24" cy="18" r="1.5" fill="#16203D"/>
          <path d="M18 23Q20 25 22 23" stroke="#16203D" stroke-width="1.2" stroke-linecap="round" fill="none"/>
        </g>
      </svg>
    </div>
  `;
}
