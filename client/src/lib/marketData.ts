export const salaryRows = [
  ["Front-end", "Estágio", "São Paulo", 2200, 3200],
  ["Front-end", "Trainee", "São Paulo", 3600, 5200],
  ["Front-end", "Júnior", "São Paulo", 4200, 6200],
  ["Back-end", "Trainee", "São Paulo", 3900, 5600],
  ["Back-end", "Júnior", "São Paulo", 4800, 7000],
  ["Dados", "Trainee", "São Paulo", 4000, 5800],
  ["Dados", "Júnior", "São Paulo", 5000, 7200],
  ["DevOps", "Trainee", "São Paulo", 4300, 6200],
  ["DevOps", "Júnior", "São Paulo", 5600, 8200],
  ["UX/UI", "Júnior", "São Paulo", 3900, 5800],
  ["QA", "Trainee", "São Paulo", 3200, 4800],
  ["Mobile", "Júnior", "São Paulo", 4700, 6900],
  ["QA", "Júnior", "São Paulo", 3600, 5400],
  ["Front-end", "Pleno", "Remoto", 7600, 10500],
  ["Back-end", "Pleno", "Remoto", 8600, 12000],
  ["Dados", "Pleno", "Remoto", 9000, 13000],
  ["DevOps", "Sênior", "Remoto", 14500, 21000],
  ["Produto", "Pleno", "Rio de Janeiro", 9000, 12500],
  ["Cloud", "Especialista", "Remoto", 18000, 26000],
].map(([area, level, city, clt, pj]) => ({ area, level, city, clt, pj }));

export const marketMonitor = {
  hotAreas: [
    { name: "Back-end", jobs: 1240, change: 8 },
    { name: "Dados", jobs: 980, change: 12 },
    { name: "Front-end", jobs: 920, change: 3 },
    { name: "DevOps", jobs: 760, change: 6 },
    { name: "UX/UI", jobs: 430, change: -2 },
  ],
  hotTechnologies: ["JavaScript", "Python", "SQL", "React", "Java", "AWS", "TypeScript", "Docker", "Node.js", "Git"],
  hotCities: [
    { name: "São Paulo", jobs: 3200 },
    { name: "Remoto", jobs: 2850 },
    { name: "Rio de Janeiro", jobs: 920 },
    { name: "Belo Horizonte", jobs: 640 },
    { name: "Curitiba", jobs: 530 },
  ],
};

export const cities = ["Todas", "São Paulo", "Rio de Janeiro", "Belo Horizonte", "Curitiba", "Recife", "Porto Alegre", "Remoto"];
export const levels = ["Todos", "Estágio", "Trainee", "Júnior", "Pleno", "Sênior", "Especialista"];
export const workTypes = ["Todos", "CLT", "PJ"];
