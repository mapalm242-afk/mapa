import bcrypt from 'bcryptjs';
import db from './database.js';

function seed() {
  const existingAdmin = db.prepare('SELECT id FROM gestores WHERE email = ?').get('admin@mapa.com');
  if (existingAdmin) {
    console.log('✅ Seed already applied — skipping.');
    return;
  }

  console.log('🌱 Running seed...');

  // Create demo company
  const empresa = db.prepare(
    `INSERT INTO empresas (nome, cnpj) VALUES (?, ?) RETURNING id`
  ).get('LM Consultoria', '00.000.000/0001-00') as { id: number };

  // Create sectors
  const setores = ['Recursos Humanos', 'Financeiro', 'Tecnologia', 'Operações'];
  for (const nome of setores) {
    db.prepare(`INSERT INTO setores (empresa_id, nome) VALUES (?, ?)`).run(empresa.id, nome);
  }

  // Create admin
  const senhaHash = bcrypt.hashSync('admin123', 10);
  db.prepare(
    `INSERT INTO gestores (empresa_id, email, senha, role) VALUES (?, ?, ?, ?)`
  ).run(null, 'admin@mapa.com', senhaHash, 'admin');

  // Create gestor for LM Consultoria
  const gestorHash = bcrypt.hashSync('gestor123', 10);
  db.prepare(
    `INSERT INTO gestores (empresa_id, email, senha, role) VALUES (?, ?, ?, ?)`
  ).run(empresa.id, 'gestor@lmconsultoria.com', gestorHash, 'gestor');

  console.log('✅ Seed complete!');
  console.log('   • Admin: admin@mapa.com / admin123');
  console.log('   • Gestor: gestor@lmconsultoria.com / gestor123');
  console.log('   • Empresa: LM Consultoria (id=1)');
  console.log('   • Setores: RH, Financeiro, TI, Operações (ids 1-4)');
}

seed();
