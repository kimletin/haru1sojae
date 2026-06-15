// 레벨별 필요 경험치, 전 구간 대비 증가율, 누적 경험치, 비율
export interface LevelExpData {
  required: number;
  increase: number;
  cumulative: number;
  ratio: number;
}

export const LEVEL_EXP: Record<number, LevelExpData> = {
  260: { required: 1731919984062,  increase: 2,    cumulative: 10882478434008,   ratio: 0.00128 },
  261: { required: 1749239183902,  increase: 0.01, cumulative: 12631717617910,   ratio: 0.00148 },
  262: { required: 1766731575741,  increase: 0.01, cumulative: 14398449193651,   ratio: 0.00169 },
  263: { required: 1784398891498,  increase: 0.01, cumulative: 16182848085149,   ratio: 0.0019  },
  264: { required: 1802242880412,  increase: 0.01, cumulative: 17985090965561,   ratio: 0.00211 },
  265: { required: 2342915744535,  increase: 0.3,  cumulative: 20328006710096,   ratio: 0.00239 },
  266: { required: 2366344901980,  increase: 0.01, cumulative: 22694351612076,   ratio: 0.00267 },
  267: { required: 2390008350999,  increase: 0.01, cumulative: 25084359963075,   ratio: 0.00295 },
  268: { required: 2413908434508,  increase: 0.01, cumulative: 27498268397583,   ratio: 0.00323 },
  269: { required: 2438047518853,  increase: 0.01, cumulative: 29936315916436,   ratio: 0.00352 },
  270: { required: 5412465491853,  increase: 1.22, cumulative: 35348781408289,   ratio: 0.00415 },
  271: { required: 5466590146771,  increase: 0.01, cumulative: 40815371555060,   ratio: 0.00479 },
  272: { required: 5521256048238,  increase: 0.01, cumulative: 46336627603298,   ratio: 0.00544 },
  273: { required: 5576468608720,  increase: 0.01, cumulative: 51913096212018,   ratio: 0.0061  },
  274: { required: 5632233294807,  increase: 0.01, cumulative: 57545329506825,   ratio: 0.00676 },
  275: { required: 11377111255510, increase: 1.02, cumulative: 68922440762335,   ratio: 0.0081  },
  276: { required: 12514822381061, increase: 0.1,  cumulative: 81437263143396,   ratio: 0.00957 },
  277: { required: 13766304619167, increase: 0.1,  cumulative: 95203567762563,   ratio: 0.01118 },
  278: { required: 15142935081083, increase: 0.1,  cumulative: 110346502843646,  ratio: 0.01296 },
  279: { required: 16657228589191, increase: 0.1,  cumulative: 127003731432837,  ratio: 0.01492 },
  280: { required: 33647601750165, increase: 1.02, cumulative: 160651333183002,  ratio: 0.01887 },
  281: { required: 37012361925181, increase: 0.1,  cumulative: 197663695108183,  ratio: 0.02322 },
  282: { required: 40713598117699, increase: 0.1,  cumulative: 238377293225882,  ratio: 0.028   },
  283: { required: 44784957929468, increase: 0.1,  cumulative: 283162251155350,  ratio: 0.03326 },
  284: { required: 49263453722414, increase: 0.1,  cumulative: 332425704877764,  ratio: 0.03904 },
  285: { required: 99512176519276, increase: 1.02, cumulative: 431937881397040,  ratio: 0.05073 },
  286: { required: 109463394171203,increase: 0.1,  cumulative: 541401275568243,  ratio: 0.06359 },
  287: { required: 120409733588323,increase: 0.1,  cumulative: 661811009156566,  ratio: 0.07773 },
  288: { required: 132450706947155,increase: 0.1,  cumulative: 794261716103721,  ratio: 0.09329 },
  289: { required: 145695777641870,increase: 0.1,  cumulative: 939957493745591,  ratio: 0.1104  },
  290: { required: 294305470836577,increase: 1.02, cumulative: 1234262964582160, ratio: 0.14497 },
  291: { required: 323736017920234,increase: 0.1,  cumulative: 1557998982502400, ratio: 0.18299 },
  292: { required: 356109619712257,increase: 0.1,  cumulative: 1914108602214650, ratio: 0.22482 },
  293: { required: 391720581683482,increase: 0.1,  cumulative: 2305829183898140, ratio: 0.27083 },
  294: { required: 430892639851830,increase: 0.1,  cumulative: 2736721823749970, ratio: 0.32144 },
  295: { required: 870403132500696,increase: 1.02, cumulative: 3607124956250660, ratio: 0.42367 },
  296: { required: 957443445750765,increase: 0.1,  cumulative: 4564568402001430, ratio: 0.53612 },
  297: { required: 1053187790325840,increase:0.1,  cumulative: 5617756192327270, ratio: 0.65982 },
  298: { required: 1158506569358420,increase:0.1,  cumulative: 6776262761685690, ratio: 0.79589 },
  299: { required: 1737759854037630,increase:0.5,  cumulative: 8514022615723330, ratio: 1       },
};
