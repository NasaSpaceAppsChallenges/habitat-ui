import { z } from 'zod'
 
export const ModuleTypes = z.enum(['private_crew_quarters', 'common_kitchen_and_mess', 'work_command_station', 'multipurpose_science_medical_area', 'dedicated_storage_logistics', 'radiation_shelter', 'dedicated_wcs', 'full_hygiene_station', 'permanent_exercise_area'])
 
export const ModuleRelationshipSchema = z.object({
  type: ModuleTypes,
  with: ModuleTypes,
  points: z.number().min(-100).max(100),
  brief_reason: z.string().min(1),
  reason: z.string().min(1)
})
 
export const ModuleRelationSchema = z.object({
  type: ModuleTypes,
  with: ModuleTypes,
  distance: z.number().min(0),
  points: z.number().min(-100).max(100)
})
 
export const EvaluatorFactorSchema = z.object({
  module_type: ModuleTypes,
  with_module_type: ModuleTypes,
  points: z.number().min(-100).max(100),
  reason: z.string().min(1)
})
 
export const ModuleRelationships: Array<z.infer<typeof ModuleRelationshipSchema>> = [
  // 'private_crew_quarters'
  {
    type: 'private_crew_quarters',
    with: 'dedicated_wcs',
    points: -100,
    brief_reason: 'Risco de contaminação e ruído. Mantenha o banheiro longe dos aposentos.',
    reason: 'O sistema de coleta de resíduos (banheiro) é a principal fonte de contaminação biológica e odores no habitat, além de gerar ruído. Para garantir a higiene e um ambiente de descanso saudável, esta área deve ser mantida o mais longe possível dos aposentos privados.'
  },
  {
    type: 'private_crew_quarters',
    with: 'permanent_exercise_area',
    points: -95,
    brief_reason: 'Ruído e vibração intensos. Mantenha a área de exercício longe dos aposentos.',
    reason: 'Os equipamentos de exercício geram ruído e vibrações intensas que se propagam pela estrutura do habitat, tornando impossível o descanso nas proximidades. É uma área que deve ser mantida longe dos aposentos silenciosos.'
  },
  {
    type: 'private_crew_quarters',
    with: 'full_hygiene_station',
    points: -90,
    brief_reason: 'Alta umidade e risco de contaminação. Mantenha a área de higiene longe dos aposentos.',
    reason: 'A estação de higiene gera muita umidade, que pode causar problemas de mofo e danificar equipamentos nos aposentos da tripulação. É considerada uma área "suja" e deve ser separada da área de descanso para manter um ambiente seco e limpo.'
  },
  {
    type: 'private_crew_quarters',
    with: 'common_kitchen_and_mess',
    points: -85,
    brief_reason: 'Área social barulhenta. Mantenha a cozinha longe da área de descanso.',
    reason: 'A cozinha e o refeitório são o centro social do habitat, gerando ruído de conversas e equipamentos, além de odores. Colocá-los longe dos aposentos privados é essencial para garantir o silêncio e a privacidade necessários para o descanso da tripulação.'
  },
  {
    type: 'private_crew_quarters',
    with: 'work_command_station',
    points: -40,
    brief_reason: 'Pode perturbar o sono. Separe a área de trabalho da área de descanso.',
    reason: 'A estação de comando pode ter operações 24 horas por dia, com luzes de monitores e ruídos que podem perturbar o sono. É melhor manter uma separação para criar uma distinção clara entre trabalho e descanso, mas não precisa ser uma distância extrema.'
  },
  {
    type: 'private_crew_quarters',
    with: 'dedicated_storage_logistics',
    points: 60,
    brief_reason: 'A massa do armazenamento protege contra radiação. Posicione-o ao redor dos aposentos.',
    reason: 'O armazenamento geral gera tráfego, mas o armazenamento de itens pessoais deve ser próximo. Mais importante, a massa dos suprimentos pode ser usada como uma excelente blindagem contra radiação, sendo benéfico posicioná-la ao redor dos aposentos.'
  },
  {
    type: 'private_crew_quarters',
    with: 'multipurpose_science_medical_area',
    points: -15,
    brief_reason: 'Boa sinergia, mas as atividades podem perturbar o sono. Posição flexível.',
    reason: 'Esta é uma área limpa e geralmente silenciosa, e sua proximidade pode ser útil para conferências médicas privadas. No entanto, dependendo do uso, alguns equipamentos ou uma emergência podem causar perturbações. Sua localização é flexível.'
  },
  {
    type: 'private_crew_quarters',
    with: 'radiation_shelter',
    points: 100,
    brief_reason: 'Acesso rápido é vital para a segurança. Mantenha o abrigo perto dos aposentos.',
    reason: 'Em caso de uma tempestade de radiação solar, a tripulação precisa chegar ao abrigo o mais rápido possível. A proximidade com a área de descanso é uma questão de segurança crítica, garantindo acesso imediato mesmo que a tripulação esteja dormindo.'
  },
  // 'common_kitchen_and_mess'
  {
    type: 'common_kitchen_and_mess',
    with: 'dedicated_wcs',
    points: -100,
    brief_reason: 'Risco de contaminação de alimentos. Mantenha a cozinha e o banheiro separados.',
    reason: 'A cozinha é a principal área "limpa" para preparação e consumo de alimentos. O banheiro (WCS) é a principal fonte de contaminação biológica e odores. Mantê-los o mais longe possível é fundamental para a saúde da tripulação e para evitar a contaminação cruzada.'
  },
  {
    type: 'common_kitchen_and_mess',
    with: 'private_crew_quarters',
    points: -85,
    brief_reason: 'Perturba o descanso da tripulação. Mantenha a cozinha longe da área de dormir.',
    reason: 'A cozinha/refeitório é um ponto de encontro social central, gerando ruído, odores e tráfego. Deve ser mantida longe dos aposentos privados para garantir o silêncio e a privacidade necessários para o descanso da tripulação.'
  },
  {
    type: 'common_kitchen_and_mess',
    with: 'full_hygiene_station',
    points: -80,
    brief_reason: 'Risco de contaminação por umidade. Separe a cozinha da área de higiene.',
    reason: 'A estação de higiene gera umidade e aerossóis que não devem entrar em contato com a área de preparação de alimentos. Separar essas duas áreas é importante para manter a higiene da cozinha e evitar contaminação.'
  },
  {
    type: 'common_kitchen_and_mess',
    with: 'permanent_exercise_area',
    points: -75,
    brief_reason: 'Risco de contaminação e ruído. Separe a cozinha da área de exercício.',
    reason: 'A área de exercícios é considerada "suja" devido ao suor e esforço físico. Deve ser mantida longe da cozinha para evitar contaminação cruzada e para que o ruído e as vibrações do equipamento não perturbem as refeições e as interações sociais.'
  },
  {
    type: 'common_kitchen_and_mess',
    with: 'work_command_station',
    points: -95,
    brief_reason: 'Distração para operações críticas. Separe a cozinha da estação de comando.',
    reason: 'A estação de comando requer concentração e não pode ser obstruída. Colocá-la perto da área de refeitório, que é de alto tráfego e barulhenta, aumenta o risco de distrações e erros em operações críticas.'
  },
  {
    type: 'common_kitchen_and_mess',
    with: 'multipurpose_science_medical_area',
    points: -50,
    brief_reason: 'Pode contaminar experimentos. Mantenha a cozinha longe da área de ciência.',
    reason: 'Embora ambas sejam áreas "limpas", experimentos científicos e procedimentos médicos podem exigir um ambiente controlado, livre das distrações, odores e do tráfego de uma cozinha. Uma separação moderada é preferível.'
  },
  {
    type: 'common_kitchen_and_mess',
    with: 'radiation_shelter',
    points: 40,
    brief_reason: 'Facilita o acesso a suprimentos, mas pode obstruir a entrada. Posição de compromisso.',
    reason: 'O acesso rápido ao abrigo é vital. Estar perto do refeitório, uma área central, pode facilitar o acesso de todos. No entanto, o equipamento e o tráfego da área podem obstruir a entrada em uma emergência. A localização é uma troca entre acesso e interferência.'
  },
  {
    type: 'common_kitchen_and_mess',
    with: 'dedicated_storage_logistics',
    points: 90,
    brief_reason: 'Acesso fácil aos alimentos é essencial. Mantenha a cozinha perto do armazenamento.',
    reason: 'A eficiência da cozinha depende do acesso rápido e fácil aos suprimentos de alimentos, utensílios e materiais de limpeza. Portanto, a área de armazenamento de logística, especialmente a de alimentos, deve estar localizada o mais próximo possível da cozinha.'
  },
  // 'work_command_station'
  {
    type: 'work_command_station',
    with: 'common_kitchen_and_mess',
    points: -95,
    brief_reason: 'Risco de distração fatal. Mantenha a estação de comando longe da área social.',
    reason: 'A cozinha é a área mais barulhenta e de maior tráfego do habitat. A estação de comando exige máxima concentração e não pode ser obstruída. A proximidade aumenta o risco de distrações e erros em operações críticas, comprometendo a segurança da missão.'
  },
  {
    type: 'work_command_station',
    with: 'permanent_exercise_area',
    points: -90,
    brief_reason: 'Vibração e ruído interferem em controles. Mantenha a estação de comando longe do exercício.',
    reason: 'Equipamentos de exercício, como esteiras, geram vibrações e ruídos significativos que podem interferir com a operação precisa de controles e distrair a tripulação durante tarefas críticas. Essas duas áreas devem ser mantidas distantes.'
  },
  {
    type: 'work_command_station',
    with: 'private_crew_quarters',
    points: -40,
    brief_reason: 'Operações 24/7 podem perturbar o sono. Separe a estação de comando dos aposentos.',
    reason: 'A estação de comando pode operar 24 horas por dia, com luzes de monitores, alarmes e conversas que perturbariam o descanso da tripulação nos aposentos. É crucial separar o ambiente de trabalho do ambiente de sono para evitar fadiga crônica.'
  },
  {
    type: 'work_command_station',
    with: 'dedicated_wcs',
    points: -65,
    brief_reason: 'Alto tráfego causa distrações. Mantenha a estação de comando longe do banheiro.',
    reason: 'O banheiro é uma área de alto tráfego que deve ser mantida longe de postos de trabalho críticos para minimizar interrupções e distrações. A separação garante que a concentração da tripulação não seja quebrada.'
  },
  {
    type: 'work_command_station',
    with: 'full_hygiene_station',
    points: -65,
    brief_reason: 'Alto tráfego causa distrações. Mantenha a estação de comando longe da área de higiene.',
    reason: 'A estação de higiene, assim como o banheiro, é uma área de tráfego frequente. Para evitar distrações e interrupções durante operações críticas, ela deve ser localizada longe da estação de comando.'
  },
  {
    type: 'work_command_station',
    with: 'dedicated_storage_logistics',
    points: -85,
    brief_reason: 'Pode obstruir o acesso. Mantenha a estação de comando livre de tráfego de logística.',
    reason: 'A área de logística pode gerar muito tráfego e obstrução temporária, especialmente durante a organização de suprimentos. É melhor mantê-la afastada para garantir que o acesso à estação de comando esteja sempre livre e desimpedido.'
  },
  {
    type: 'work_command_station',
    with: 'multipurpose_science_medical_area',
    points: 70,
    brief_reason: 'Cria um "centro de trabalho" eficiente. Mantenha as áreas técnicas próximas.',
    reason: "Ambas são áreas de trabalho 'limpas' que exigem concentração e infraestrutura similar (energia, dados, monitores). Agrupá-las cria um 'centro de trabalho' eficiente, permitindo o compartilhamento de recursos e facilitando a colaboração da tripulação em tarefas técnicas."
  },
  {
    type: 'work_command_station',
    with: 'radiation_shelter',
    points: 95,
    brief_reason: 'O comando do veículo é necessário no abrigo. Mantenha a estação de comando próxima.',
    reason: 'Durante uma emergência de radiação, a tripulação pode ficar confinada no abrigo por dias. É essencial que eles possam monitorar e comandar os sistemas críticos da espaçonave a partir do abrigo. Portanto, a proximidade é um requisito de segurança fundamental.'
  },
  // 'multipurpose_science_medical_area'
  {
    type: 'multipurpose_science_medical_area',
    with: 'dedicated_wcs',
    points: -100,
    brief_reason: 'Risco de contaminação biológica. Mantenha a área de ciência longe do banheiro.',
    reason: 'A área de ciência e medicina requer um ambiente o mais estéril possível. O banheiro (WCS) é a principal fonte de contaminação biológica. Uma separação máxima é absolutamente crítica para prevenir a contaminação de amostras, experimentos e para garantir a segurança em procedimentos médicos.'
  },
  {
    type: 'multipurpose_science_medical_area',
    with: 'full_hygiene_station',
    points: -90,
    brief_reason: 'Risco de contaminação por umidade. Mantenha a área de ciência longe da higiene.',
    reason: 'A alta umidade e os aerossóis da estação de higiene podem danificar equipamentos eletrônicos sensíveis e contaminar experimentos. Manter a área de ciência seca e controlada exige que ela seja mantida longe da estação de higiene.'
  },
  {
    type: 'multipurpose_science_medical_area',
    with: 'permanent_exercise_area',
    points: -85,
    brief_reason: 'Vibrações podem arruinar experimentos. Mantenha a área de ciência longe do exercício.',
    reason: 'Vibrações de equipamentos de exercício (como esteiras) podem arruinar experimentos sensíveis que exigem estabilidade (ex: microscopia). Além disso, o suor e o esforço físico tornam a área de exercício "suja", devendo ser separada do ambiente limpo da ciência.'
  },
  {
    type: 'multipurpose_science_medical_area',
    with: 'common_kitchen_and_mess',
    points: -50,
    brief_reason: 'Ruído e odores podem contaminar. Mantenha a área de ciência longe da cozinha.',
    reason: 'A cozinha é uma área de alto tráfego, ruído e odores de comida. Tarefas científicas e médicas complexas exigem concentração e um ambiente livre de contaminação por partículas de alimentos. Essas duas áreas de trabalho devem ser separadas.'
  },
  {
    type: 'multipurpose_science_medical_area',
    with: 'radiation_shelter',
    points: 45,
    brief_reason: 'Permite resposta médica segura. Posicione perto, se possível.',
    reason: 'Não há uma forte ligação operacional. A localização do abrigo é ditada pela necessidade de acesso rápido de todas as áreas. A proximidade com a área médica é um bônus secundário, mas não um fator determinante.'
  },
  {
    type: 'multipurpose_science_medical_area',
    with: 'private_crew_quarters',
    points: -15,
    brief_reason: 'Boa sinergia, mas as atividades podem perturbar. Posição flexível.',
    reason: 'Ambas são áreas "limpas" e geralmente silenciosas. A proximidade pode ser útil para conferências médicas privadas. No entanto, uma emergência médica ou um experimento ruidoso poderiam perturbar o descanso da tripulação, então a adjacência direta não é ideal.'
  },
  {
    type: 'multipurpose_science_medical_area',
    with: 'work_command_station',
    points: 70,
    brief_reason: 'Cria um "centro de trabalho" eficiente. Mantenha as áreas técnicas próximas.',
    reason: 'Agrupar estas duas áreas técnicas e "limpas" cria um "centro de trabalho" eficiente. Isso facilita a colaboração da tripulação, o compartilhamento de dados entre sistemas do veículo e resultados de experimentos, e otimiza o uso de infraestrutura como energia e redes.'
  },
  {
    type: 'multipurpose_science_medical_area',
    with: 'dedicated_storage_logistics',
    points: 80,
    brief_reason: 'O acesso a suprimentos é crucial. Mantenha a área de ciência perto do armazenamento.',
    reason: 'Atividades científicas e médicas dependem de acesso constante a kits de experimentos, suprimentos médicos, amostras e equipamentos. Ter a área de armazenamento por perto economiza um tempo valioso da tripulação e melhora drasticamente a eficiência do trabalho.'
  },
  // 'dedicated_storage_logistics'
  {
    type: 'dedicated_storage_logistics',
    with: 'work_command_station',
    points: -85,
    brief_reason: 'Risco de obstruir acesso crítico. Mantenha o armazenamento longe da estação de comando.',
    reason: 'A estação de comando deve estar sempre acessível e livre de obstruções. A área de logística é um local de alto tráfego e desordem temporária durante a carga/descarga, o que representa um risco de segurança ao bloquear o acesso a controles críticos.'
  },
  {
    type: 'dedicated_storage_logistics',
    with: 'private_crew_quarters',
    points: 60,
    brief_reason: 'A massa do armazenamento protege contra radiação. Mantenha-o ao redor dos aposentos.',
    reason: 'O armazenamento geral gera tráfego, mas o armazenamento de itens pessoais deve ser próximo. Mais importante, a massa dos suprimentos pode ser usada como uma excelente blindagem contra radiação, sendo benéfico posicioná-la ao redor dos aposentos.'
  },
  {
    type: 'dedicated_storage_logistics',
    with: 'permanent_exercise_area',
    points: 5,
    brief_reason: 'Sem forte ligação operacional. Posição flexível.',
    reason: 'A área de exercícios precisa de armazenamento para equipamentos de manutenção e itens pessoais, mas não consome um grande volume de suprimentos regularmente. A proximidade com o armazenamento principal não é um fator crítico.'
  },
  {
    type: 'dedicated_storage_logistics',
    with: 'dedicated_wcs',
    points: 70,
    brief_reason: 'Facilita o reabastecimento. Mantenha o armazenamento perto do banheiro.',
    reason: 'O banheiro requer reabastecimento constante de consumíveis (papel, luvas, kits de limpeza) e peças de manutenção. A proximidade com o armazenamento torna essas tarefas de rotina muito mais rápidas e eficientes.'
  },
  {
    type: 'dedicated_storage_logistics',
    with: 'full_hygiene_station',
    points: 70,
    brief_reason: 'Facilita o reabastecimento. Mantenha o armazenamento perto da área de higiene.',
    reason: 'A estação de higiene consome regularmente toalhas, sabonetes e outros itens. Ter o armazenamento por perto é essencial para a eficiência das rotinas diárias da tripulação e para facilitar o reabastecimento.'
  },
  {
    type: 'dedicated_storage_logistics',
    with: 'multipurpose_science_medical_area',
    points: 85,
    brief_reason: 'O acesso a suprimentos é crucial. Mantenha o armazenamento perto da área de ciência.',
    reason: 'Atividades científicas e médicas são os maiores consumidores de equipamentos, kits e suprimentos descartáveis. O acesso rápido e fácil ao armazenamento é crucial para a eficiência do trabalho e para responder a uma emergência médica sem demora.'
  },
  {
    type: 'dedicated_storage_logistics',
    with: 'common_kitchen_and_mess',
    points: 90,
    brief_reason: 'O acesso fácil aos alimentos é essencial. Mantenha o armazenamento perto da cozinha.',
    reason: 'A cozinha é a área que mais depende do acesso rápido e frequente aos suprimentos de alimentos e consumíveis. Colocar o armazenamento logístico o mais perto possível da cozinha é o fator mais importante para a eficiência das operações diárias.'
  },
  {
    type: 'dedicated_storage_logistics',
    with: 'radiation_shelter',
    points: 95,
    brief_reason: 'A massa do armazenamento serve como blindagem. Mantenha-o perto do abrigo.',
    reason: 'O abrigo contra radiação precisa ser abastecido com suprimentos de emergência (comida, água, kits médicos). Além disso, a própria massa dos itens armazenados (especialmente água) pode ser usada para construir ou reforçar a blindagem do abrigo, tornando a proximidade um fator de segurança vital.'
  },
  // 'radiation_shelter'
  {
    type: 'radiation_shelter',
    with: 'permanent_exercise_area',
    points: -70,
    brief_reason: 'Risco de obstruir acesso de emergência. Mantenha o abrigo longe do exercício.',
    reason: 'A área de exercícios pode obstruir o acesso rápido e de emergência ao abrigo. O equipamento e a atividade da tripulação criam um potencial gargalo que é inaceitável em uma emergência de radiação.'
  },
  {
    type: 'radiation_shelter',
    with: 'full_hygiene_station',
    points: 20,
    brief_reason: 'Permite higiene durante o confinamento. Posicione perto, se possível.',
    reason: 'Embora o acesso à higiene seja benéfico durante longas estadias, não é tão crítico quanto outras funções. A localização do abrigo é primariamente ditada pela segurança e acesso imediato, não pela higiene de rotina.'
  },
  {
    type: 'radiation_shelter',
    with: 'common_kitchen_and_mess',
    points: 70,
    brief_reason: 'Facilita o acesso a suprimentos. Mantenha o abrigo perto da cozinha.',
    reason: 'Durante um confinamento de vários dias, a tripulação precisará de acesso a comida e água. Localizar o abrigo perto da cozinha facilita a recuperação segura de suprimentos, minimizando o tempo fora da área protegida.'
  },
  {
    type: 'radiation_shelter',
    with: 'multipurpose_science_medical_area',
    points: 80,
    brief_reason: 'Permite resposta médica segura. Mantenha o abrigo perto da área médica.',
    reason: 'Em caso de uma emergência médica durante um evento de radiação, ter suprimentos médicos e uma área de tratamento perto do abrigo é crítico. Essa proximidade permite uma resposta médica mais segura e rápida, minimizando a exposição.'
  },
  {
    type: 'radiation_shelter',
    with: 'work_command_station',
    points: 95,
    brief_reason: 'O comando do veículo é necessário no abrigo. Mantenha o abrigo perto da estação de comando.',
    reason: 'É essencial que a tripulação monitore e comande os sistemas críticos da espaçonave enquanto estiver confinada no abrigo. A proximidade da estação de comando, ou ter uma interface de comando dentro do abrigo, é um requisito fundamental de segurança.'
  },
  {
    type: 'radiation_shelter',
    with: 'dedicated_wcs',
    points: 90,
    brief_reason: 'O acesso ao banheiro é essencial no confinamento. Mantenha o abrigo perto do banheiro.',
    reason: 'A tripulação pode ficar confinada por dias e precisará de acesso frequente ao banheiro. A proximidade minimiza o tempo gasto fora do abrigo, reduzindo a exposição à radiação durante pausas biológicas essenciais.'
  },
  {
    type: 'radiation_shelter',
    with: 'dedicated_storage_logistics',
    points: 95,
    brief_reason: 'A massa do armazenamento serve como blindagem. Mantenha-o perto do abrigo.',
    reason: 'A massa dos suprimentos armazenados (especialmente água e comida) fornece uma excelente blindagem contra radiação. Co-localizar o abrigo com a área principal de armazenamento permite que essa massa seja usada como um componente primário da construção e reforço do abrigo.'
  },
  {
    type: 'radiation_shelter',
    with: 'private_crew_quarters',
    points: 100,
    brief_reason: 'Acesso rápido é vital para a segurança. Mantenha o abrigo perto dos aposentos.',
    reason: 'O acesso rápido e desobstruído dos aposentos para o abrigo é o fator mais crítico para a segurança da tripulação. Um evento de radiação pode ocorrer a qualquer momento, e minimizar o tempo para chegar à segurança, especialmente ao acordar, é primordial.'
  },
  // 'dedicated_wcs'
  {
    type: 'dedicated_wcs',
    with: 'common_kitchen_and_mess',
    points: -100,
    brief_reason: 'Risco crítico de contaminação de alimentos. Separação máxima necessária.',
    reason: 'Esta é a pior combinação possível. A separação máxima entre a área de preparação de alimentos e a de coleta de resíduos é uma regra fundamental de higiene para prevenir a contaminação de alimentos e a propagação de doenças.'
  },
  {
    type: 'dedicated_wcs',
    with: 'multipurpose_science_medical_area',
    points: -100,
    brief_reason: 'Risco de contaminar experimentos. Separação máxima necessária.',
    reason: 'A contaminação biológica do banheiro pode comprometer ou invalidar experimentos científicos sensíveis e representa um risco inaceitável durante procedimentos médicos que exigem esterilidade.'
  },
  {
    type: 'dedicated_wcs',
    with: 'private_crew_quarters',
    points: -100,
    brief_reason: 'Insalubre e barulhento para a área de descanso. Separação máxima necessária.',
    reason: 'A proximidade é inaceitável. Odores, ruído e o risco de contaminação tornam o ambiente dos aposentos insalubre e impossibilitam o descanso, comprometendo diretamente a saúde e o bem-estar da tripulação.'
  },
  {
    type: 'dedicated_wcs',
    with: 'work_command_station',
    points: -65,
    brief_reason: 'Alto tráfego causa distrações. Mantenha o banheiro longe da estação de comando.',
    reason: 'O tráfego constante de tripulantes indo e vindo do banheiro cria uma distração inaceitável para operadores que realizam tarefas críticas que exigem concentração máxima, representando um risco para a segurança da missão.'
  },
  {
    type: 'dedicated_wcs',
    with: 'permanent_exercise_area',
    points: 75,
    brief_reason: 'Cria uma "zona suja" consolidada. Mantenha o banheiro perto do exercício.',
    reason: "Ambas são áreas 'sujas'. Agrupá-las com a estação de higiene cria uma zona dedicada a atividades que geram contaminação (suor, resíduos), isolando-as efetivamente das áreas de convivência e trabalho."
  },
  {
    type: 'dedicated_wcs',
    with: 'full_hygiene_station',
    points: 80,
    brief_reason: 'Cria uma "zona suja" eficiente. Mantenha o banheiro perto da área de higiene.',
    reason: "Agrupar o banheiro e a estação de higiene cria uma 'zona úmida/suja' consolidada, otimizando o fluxo de trabalho da tripulação (ex: usar o banheiro e depois lavar as mãos) e contendo as áreas de maior contaminação longe das áreas limpas."
  },
  {
    type: 'dedicated_wcs',
    with: 'dedicated_storage_logistics',
    points: 70,
    brief_reason: 'Facilita o reabastecimento. Mantenha o banheiro perto do armazenamento.',
    reason: 'O banheiro é um sistema que exige manutenção e reabastecimento regular de consumíveis. A proximidade com a área de logística economiza um tempo valioso da tripulação e simplifica as operações de rotina.'
  },
  {
    type: 'dedicated_wcs',
    with: 'radiation_shelter',
    points: 90,
    brief_reason: 'O acesso ao banheiro é essencial no confinamento. Mantenha-o perto do abrigo.',
    reason: 'Durante um confinamento por radiação que pode durar dias, o acesso rápido e frequente ao banheiro é essencial. A proximidade minimiza o tempo que a tripulação passa fora da área protegida, reduzindo a dose de radiação recebida.'
  },
  // 'full_hygiene_station'
  {
    type: 'full_hygiene_station',
    with: 'multipurpose_science_medical_area',
    points: -90,
    brief_reason: 'Risco de contaminação por umidade. Separe a higiene da área de ciência.',
    reason: 'A alta umidade e as partículas de água e sabão da estação de higiene podem danificar equipamentos eletrônicos sensíveis e contaminar amostras ou experimentos que exigem um ambiente controlado. A separação é crucial.'
  },
  {
    type: 'full_hygiene_station',
    with: 'private_crew_quarters',
    points: -90,
    brief_reason: 'Alta umidade é prejudicial para a área de descanso. Separe a higiene dos aposentos.',
    reason: 'A umidade gerada pode causar problemas de mofo, desconforto e danos a itens pessoais nos aposentos. A estação de higiene deve ser mantida longe da área de descanso para garantir um ambiente seco, saudável e silencioso.'
  },
  {
    type: 'full_hygiene_station',
    with: 'common_kitchen_and_mess',
    points: -80,
    brief_reason: 'Risco de contaminação por umidade. Separe a higiene da cozinha.',
    reason: 'Aerossóis e umidade da higiene não devem entrar em contato com a área de preparação e consumo de alimentos para evitar contaminação e manter a qualidade do ambiente de refeições.'
  },
  {
    type: 'full_hygiene_station',
    with: 'work_command_station',
    points: -65,
    brief_reason: 'Alto tráfego causa distrações. Mantenha a higiene longe da estação de comando.',
    reason: 'O tráfego frequente e a umidade potencial tornam esta área inadequada para estar perto da estação de comando, que exige um ambiente controlado, seco e livre de distrações.'
  },
  {
    type: 'full_hygiene_station',
    with: 'radiation_shelter',
    points: 20,
    brief_reason: 'Permite higiene durante o confinamento. Posicione perto, se possível.',
    reason: 'A necessidade de higiene durante um confinamento por radiação é secundária à sobrevivência imediata. A localização do abrigo não deve ser comprometida pela necessidade de estar perto da estação de higiene.'
  },
  {
    type: 'full_hygiene_station',
    with: 'dedicated_storage_logistics',
    points: 70,
    brief_reason: 'Facilita o reabastecimento. Mantenha a higiene perto do armazenamento.',
    reason: 'A estação de higiene requer um reabastecimento constante de consumíveis como toalhas, sabão e kits de higiene. A proximidade com o armazenamento economiza tempo e simplifica as rotinas diárias da tripulação.'
  },
  {
    type: 'full_hygiene_station',
    with: 'dedicated_wcs',
    points: 80,
    brief_reason: 'Cria uma "zona suja" eficiente. Mantenha a higiene perto do banheiro.',
    reason: "Agrupar a estação de higiene e o banheiro cria uma 'zona úmida' consolidada e eficiente. Isso centraliza o encanamento, contém a umidade e melhora o fluxo de trabalho da tripulação, isolando as funções 'sujas' do resto do habitat."
  },
  {
    type: 'full_hygiene_station',
    with: 'permanent_exercise_area',
    points: 100,
    brief_reason: 'Fluxo de trabalho ideal pós-exercício. Mantenha a higiene perto do exercício.',
    reason: 'Esta é a sinergia mais forte. Após o exercício, a tripulação precisa se limpar imediatamente. Ter a estação de higiene ao lado da área de exercícios melhora drasticamente o fluxo de trabalho, o conforto e contém o suor e a contaminação em uma única zona, evitando que se espalhe pelo habitat.'
  },
  // 'permanent_exercise_area'
  {
    type: 'permanent_exercise_area',
    with: 'private_crew_quarters',
    points: -95,
    brief_reason: 'Ruído e vibração intensos. Mantenha o exercício longe da área de descanso.',
    reason: 'A área de exercícios produz ruído e vibrações intensas que tornam o sono e o descanso impossíveis. Manter a máxima distância entre eles é a principal prioridade de design para garantir a saúde e o bem-estar da tripulação.'
  },
  {
    type: 'permanent_exercise_area',
    with: 'multipurpose_science_medical_area',
    points: -85,
    brief_reason: 'Vibrações podem arruinar experimentos. Mantenha o exercício longe da área de ciência.',
    reason: 'As vibrações do equipamento de exercício podem arruinar experimentos científicos delicados (como microscopia) e interferir com procedimentos médicos de precisão. Além disso, é uma área "suja" (suor) que deve ser mantida longe de ambientes limpos.'
  },
  {
    type: 'permanent_exercise_area',
    with: 'work_command_station',
    points: -90,
    brief_reason: 'Distração para operações críticas. Mantenha o exercício longe da estação de comando.',
    reason: 'O ruído e as vibrações são uma grande fonte de distração para a tripulação que executa tarefas críticas na estação de comando, aumentando o risco de erros. A separação é uma questão de segurança da missão.'
  },
  {
    type: 'permanent_exercise_area',
    with: 'common_kitchen_and_mess',
    points: -75,
    brief_reason: 'Ruído e odores perturbam as refeições. Mantenha o exercício longe da cozinha.',
    reason: 'A área de exercícios é considerada "suja" e não deve estar perto da área de preparação de alimentos. Além disso, o barulho, o cheiro e a visão de alguém se exercitando são desagradáveis durante as refeições, prejudicando o moral da tripulação.'
  },
  {
    type: 'permanent_exercise_area',
    with: 'radiation_shelter',
    points: -70,
    brief_reason: 'Risco de obstruir acesso de emergência. Mantenha o exercício longe do abrigo.',
    reason: 'O equipamento de exercício é volumoso e pode obstruir o caminho para o abrigo contra radiação, retardando o acesso em uma emergência. Um caminho desimpedido para o abrigo é uma prioridade de segurança.'
  },
  {
    type: 'permanent_exercise_area',
    with: 'dedicated_storage_logistics',
    points: 5,
    brief_reason: 'Sem forte ligação operacional. Posição flexível.',
    reason: 'Não há uma forte ligação operacional ou conflito. A área de exercícios não precisa de acesso frequente ao armazenamento principal, e o armazenamento não é afetado pelo ruído ou vibração.'
  },
  {
    type: 'permanent_exercise_area',
    with: 'dedicated_wcs',
    points: 75,
    brief_reason: 'Cria uma "zona suja" consolidada. Mantenha o exercício perto do banheiro.',
    reason: "Ambas são áreas 'sujas'. Agrupá-las ajuda a consolidar e isolar as fontes de contaminação em uma única zona do habitat, longe das áreas de convivência e trabalho limpas."
  },
  {
    type: 'permanent_exercise_area',
    with: 'full_hygiene_station',
    points: 100,
    brief_reason: 'Fluxo de trabalho ideal pós-exercício. Mantenha o exercício perto da área de higiene.',
    reason: 'Esta é a combinação mais eficiente e desejável. Após o exercício, a tripulação precisa se limpar imediatamente. Ter a estação de higiene ao lado contém o suor em uma única zona "suja" e cria um fluxo de trabalho perfeito, melhorando o conforto e a higiene geral.'
  }
]
 