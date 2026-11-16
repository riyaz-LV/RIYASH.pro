import type { ProjectWork, ResumeProfile } from '../types/portfolio';

export const DEFAULT_RESUME_PROFILE: ResumeProfile = {
  fullName: 'L. Riyash',
  brandTitle: 'L. Riyash',
  roleTitle: 'Aspiring AI Engineer · GenAI · Cloud Computing · DevOps',
  email: 'riyash0046@gmail.com',
  phone: '8838609570',
  linkedin: 'https://linkedin.com/in/riyash-l-84aa673ab',
  github: 'https://github.com/riyaz-LV',
  location: 'Nagapattinam, Tamil Nadu, India',
  availability: 'Seeking Internship & Entry-Level Opportunities',
  summary:
    'B.Tech Information Technology student interested in Artificial Intelligence, Generative AI, Agentic AI, Cloud Computing, and DevOps. Developing foundational technical knowledge and exploring AI-powered applications, cloud technologies, and software automation while crafting interactive 4K 3D web experiences.',
  careerObjective:
    'Seeking an internship or entry-level opportunity in AI, Generative AI, Cloud Computing, or DevOps to develop practical engineering skills and contribute to real-world technology projects.',
  website: 'https://github.com/riyaz-LV',
  metrics: [
    { label: 'B.Tech IT · 2024–2028', value: '7.00 CGPA' },
    { label: 'Core Technical Domains', value: '5 Stacks' },
    { label: 'Featured 4K 3D Showcases', value: '3 Reels' },
    { label: 'Stage Render Fidelity', value: '3840×2160' },
  ],
  experience: [
    {
      id: 'exp-1',
      role: 'TRI-PULSE AI Personal Assistant',
      studio: 'AI & Workflow Automation Project',
      location: 'Concept & Architecture',
      period: '2025 – Present',
      highlights: [
        'Designed the concept for a bilingual Tamil-English personal assistant focused on technical learning, athletics, and self-motivation.',
        'Exploring conversational AI and task-oriented assistant workflows; planned features include personalized guidance and goal tracking.',
      ],
    },
    {
      id: 'exp-2',
      role: 'AI-Powered College Information Chatbot',
      studio: 'LLM & RAG Exploration Project',
      location: 'EGS Pillay Engineering College',
      period: '2025',
      highlights: [
        'Planning a chatbot to help students access college-related information through natural-language questions.',
        'Exploring a college knowledge base and large language models; considering Retrieval-Augmented Generation (RAG) as a possible approach.',
      ],
    },
    {
      id: 'exp-3',
      role: 'Aurora 4K 3D Animation & WebGL Portfolio',
      studio: 'Three.js · GLSL · React Technical Build',
      location: 'Nagapattinam, India',
      period: '2025',
      highlights: [
        'Engineered an interactive real-time 3D WebGL stage with custom volumetric Aurora Borealis shaders, PBR metallic finishes, and exploded mechanical inspection.',
        'Integrated procedural studio reflections, ACES Filmic tone mapping, and client-side 4K PNG / PDF resume generation.',
      ],
    },
  ],
  resumeProjects: [
    {
      id: 'rp-1',
      title: 'TRI-PULSE AI Personal Assistant',
      bullets: [
        'Concept for a bilingual Tamil-English personal assistant focused on technical learning, athletics, and self-motivation.',
        'Exploring conversational AI and task-oriented assistant workflows; planned features include personalized guidance and goal tracking.',
      ],
    },
    {
      id: 'rp-2',
      title: 'AI-Powered College Information Chatbot',
      bullets: [
        'Planning a chatbot to help students access college-related information through natural-language questions.',
        'Exploring a college knowledge base and large language models; considering Retrieval-Augmented Generation (RAG) as a possible approach.',
      ],
    },
  ],
  education: [
    {
      id: 'edu-1',
      degree: 'B.Tech – Information Technology',
      institution: 'EGS Pillay Engineering College, Nagapattinam, Tamil Nadu',
      year: '2024 – 2028',
      detail: 'Currently Pursuing · CGPA: 7.00 CGPA',
    },
    {
      id: 'edu-2',
      degree: 'HSC (Class XII)',
      institution: 'Musthafa Matriculation Higher Secondary School, Chidambaram, Tamil Nadu',
      year: '2024',
      detail: 'Passed 2024 · 65%',
    },
    {
      id: 'edu-3',
      degree: 'SSLC (Class X)',
      institution: 'Musthafa Matriculation Higher Secondary School, Chidambaram, Tamil Nadu',
      year: '2022',
      detail: 'Passed 2022 · 60%',
    },
  ],
  skillGroups: [
    {
      category: 'AI Automation & GenAI',
      items: [
        'AI workflow automation fundamentals',
        'LLM-powered workflows',
        'API integration concepts',
        'Generative AI fundamentals',
        'Large Language Models (LLMs)',
        'Prompt engineering concepts',
      ],
    },
    {
      category: 'Agentic AI & Cloud Computing',
      items: [
        'AI agent fundamentals',
        'Task automation concepts',
        'Agent workflows',
        'AWS fundamentals',
        'Cloud infrastructure concepts',
      ],
    },
    {
      category: 'DevOps & 3D Web Graphics',
      items: [
        'Git / GitHub',
        'Linux',
        'Docker',
        'CI/CD fundamentals',
        'Three.js / WebGL2',
        'GLSL Shaders',
      ],
    },
  ],
  coreStrengths: [
    'Problem-solving',
    'Continuous Learning',
    'Adaptability',
    'Teamwork',
    'Analytical Thinking',
  ],
  awards: [
    'Zano AI Career Accelerator – Zano IT Technologies',
  ],
};

export const PORTFOLIO_WORKS: ProjectWork[] = [
  {
    id: 'work-aurora-cathedral',
    title: 'Arctic Basalt Pavilion',
    category: '3D Animation',
    year: '2025',
    resolution: '3840 × 2160',
    frameRate: '60 FPS',
    engine: 'Unreal Engine 5 · Lumen',
    polycount: '14.2M Tris',
    duration: '01:48 Reel',
    client: 'Aurora Spatial Study',
    imageUrl: '/src/assets/images/work_aurora_cathedral_1794835773348.jpg',
    linkedScene: 'basalt-pavilion',
    summary:
      'Designed to visualize an arctic basalt pavilion under twilight illumination, this 4K architectural animation aimed to demonstrate real-time volumetric atmosphere at 60 FPS. I contributed the procedural monolith geometry, thin-film iridescent glass shaders, wet stone roughness calibration, and custom GLSL aurora curtains driving reflections across the icy terrain.',
    breakdown: [
      'Custom multi-octave FBM volumetric ribbon shader driving real-time sky illumination and wet basalt specular reflections.',
      'Procedural cliff and ice-shelf terrain assembled with sculpted basalt monoliths and layered atmospheric exponential fog.',
      'ACEScg render grading tuned for crisp 4K UHD presentation.',
    ],
  },
  {
    id: 'work-kinetic-astrolabe',
    title: 'Chrono-Optic Astrolabe',
    category: 'Lookdev & Shaders',
    year: '2025',
    resolution: '3840 × 2160',
    frameRate: '60 FPS',
    engine: 'Octane · Three.js PBR',
    polycount: '4.8M Tris',
    duration: '00:54 Macro',
    client: 'Precision Kinematics Study',
    imageUrl: '/src/assets/images/work_kinetic_chronograph_1794835774169.jpg',
    linkedScene: 'kinetic-core',
    summary:
      'Built as a macro 4K mechanical animation study, the objective was to showcase concentric gimbal motion and physically accurate optical glass dispersion. I modeled the multi-axis interlocking rings, engineered radial anisotropic brushed-titanium and sapphire BSDF materials, and orchestrated dual warm-tungsten and cyan rim studio lighting.',
    breakdown: [
      'Anisotropic radial brushed-metal BSDF paired with 4K procedural star-chart bump and roughness maps.',
      'Physical optical glass dispersion catching dual warm tungsten key and cool cyan rim softboxes.',
      'Synchronized gimbal rotation axes inspectable interactively in exploded view.',
    ],
  },
  {
    id: 'work-bioluminescent-flow',
    title: 'Abyssal Bioluminescence',
    category: '3D Animation',
    year: '2024',
    resolution: '3840 × 2160',
    frameRate: '48 FPS',
    engine: 'Houdini · Karma XPU',
    polycount: '22.6M Voxels',
    duration: '01:12 Sim',
    client: 'Procedural Fluid Study',
    imageUrl: '/src/assets/images/work_bioluminescent_flow_1794835774016.jpg',
    linkedScene: 'optical-rig',
    summary:
      'Created as an experimental 4K motion sequence combining procedural fluid dynamics with refractive glass surfaces, this piece aimed to capture bioluminescent flow inside dark abyssal depth. I authored the curl-noise velocity advection curves, tuned subsurface scattering and caustic highlights, and integrated the optical camera rig for live inspection.',
    breakdown: [
      'Curl-noise velocity fields driving advected luminous micro-particles inside refractive glass spline tubes.',
      'Subsurface scattering and dual-lobe specular reflections tuned to preserve silhouette readability against dark obsidian depth.',
      'Paired with an interactive 3D optical cinema rig on the live WebGL stage.',
    ],
  },
];
