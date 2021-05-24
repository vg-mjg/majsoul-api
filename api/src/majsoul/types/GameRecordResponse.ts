export interface Error {
	code: number;
	u32_params: number[];
	str_params: string[];
	json_param: string;
}

export interface GameDetailRule {
	time_fixed: number;
	time_add: number;
	dora_count: number;
	shiduan: number;
	init_point: number;
	fandian: number;
	can_jifei: boolean;
	tianbian_value: number;
	liqibang_value: number;
	changbang_value: number;
	noting_fafu_1: number;
	noting_fafu_2: number;
	noting_fafu_3: number;
	have_liujumanguan: boolean;
	have_qieshangmanguan: boolean;
	have_biao_dora: boolean;
	have_gang_biao_dora: boolean;
	ming_dora_immediately_open: boolean;
	have_li_dora: boolean;
	have_gang_li_dora: boolean;
	have_sifenglianda: boolean;
	have_sigangsanle: boolean;
	have_sijializhi: boolean;
	have_jiuzhongjiupai: boolean;
	have_sanjiahele: boolean;
	have_toutiao: boolean;
	have_helelianzhuang: boolean;
	have_helezhongju: boolean;
	have_tingpailianzhuang: boolean;
	have_tingpaizhongju: boolean;
	have_yifa: boolean;
	have_nanruxiru: boolean;
	jingsuanyuandian: number;
	shunweima_2: number;
	shunweima_3: number;
	shunweima_4: number;
	bianjietishi: boolean;
	ai_level: number;
	have_zimosun: boolean;
	disable_multi_yukaman: boolean;
	fanfu: number;
	guyi_mode: number;
	dora3_mode: number;
	begin_open_mode: number;
	jiuchao_mode: number;
	muyu_mode: number;
}

export interface GameTestingEnvironmentSet {
	paixing: number;
	left_count: number;
}

export interface GameMode {
	mode: number;
	ai: boolean;
	extendinfo: string;
	detail_rule: GameDetailRule;
	testing_environment: GameTestingEnvironmentSet;
}

export interface GameMetaData {
	room_id: number;
	mode_id: number;
	contest_uid: number;
}

export interface GameConfig {
	category: number;
	mode: GameMode;
	meta: GameMetaData;
}

export interface ViewSlot {
	slot: number;
	item_id: number;
}

export interface Character {
	charid: number;
	level: number;
	exp: number;
	views: ViewSlot[];
	skin: number;
	is_upgraded: boolean;
	extra_emoji: number[];
}

export interface AccountLevel {
	id: number;
	score: number;
}

export interface AccountInfo {
	account_id: number;
	seat: number;
	nickname: string;
	avatar_id: number;
	character: Character;
	title: number;
	level: AccountLevel;
	level3: AccountLevel;
	avatar_frame: number;
	verified: number;
	views: ViewSlot[];
}

export interface PlayerItem {
	seat: number;
	total_point: number;
	part_point_1: number;
	part_point_2: number;
	grading_score: number;
	gold: number;
}

export interface GameEndResult {
	players: PlayerItem[];
}

export interface RecordGame {
	uuid: string;
	start_time: number;
	end_time: number;
	config: GameConfig;
	accounts: AccountInfo[];
	result: GameEndResult;
}

export interface TingPaiInfo {
	tile: string;
	haveyi: boolean;
	yiman: boolean;
	count: number;
	fu: number;
	biao_dora_count: number;
	yiman_zimo: boolean;
	count_zimo: number;
	fu_zimo: number;
}

export interface TingPai {
	seat: number;
	tingpais1: TingPaiInfo[];
}

export interface OptionalOperation {
	type: number;
	combination: string;
}

export interface OptionalOperationList {
	seat: number;
	operation_list: OptionalOperation[];
	time_add: number;
	time_fixed: number;
}

export interface NewRoundOpenedTiles {
	seat: number;
	tiles: string[];
	count: number[];
}

export interface MuyuInfo {
	seat: number;
	count: number;
	count_max: number;
	id: number;
}

export interface RecordNewRound {
	chang: number;
	ju: number;
	ben: number;
	dora: string;
	scores: number[];
	liqibang: number;
	tiles0: string[];
	tiles1: string[];
	tiles2: string[];
	tiles3: string[];
	tingpai: TingPai[];
	operation: OptionalOperationList;
	md5: string;
	paishan: string;
	left_tile_count: number;
	doras: string[];
	opens: NewRoundOpenedTiles[];
	muyu: MuyuInfo;
}

export interface RecordDiscardTile {
	seat: number;
	tile: string;
	is_liqi: boolean;
	moqie: boolean;
	zhenting: boolean[];
	tingpais: TingPaiInfo[];
	doras: string[];
	is_wliqi: boolean;
	operations: OptionalOperationList[];
	tile_state: number;
	muyu: MuyuInfo
}

export interface RecordDealTile {
	seat: number;
	tile: string;
	left_tile_count: number;
	liqi: LiQiSuccess;
	doras: string[];
	zhenting: boolean[];
	operation: OptionalOperationList;
	tile_state: number;
	muyu: MuyuInfo;
}

export interface RecordChiPengGang {
	seat: number;
	type: number;
	tiles: string[];
	froms: number;
	liqi: LiQiSuccess;
	zhenting: boolean[];
	operation: OptionalOperationList;
	tile_states: number;
	muyu: MuyuInfo;
}

export interface RecordAnGangAddGang {
	seat: number;
	type: number;
	tiles: string;
	doras: string[];
	operations: OptionalOperationList[];
	muyu: MuyuInfo;
}

export interface LiQiSuccess {
	seat: number;
	score: number;
	liqibang: number;
}

export interface RecordLiuJu {
	type: number;
	gameend: GameEnd;
	seat: number;
	tiles: string[];
	liqi: LiQiSuccess;
	allplayertiles: string[];
	muyu: MuyuInfo;
}

export interface NoTilePlayerInfo {
	tingpai: boolean;
	hand: string[];
	tings: TingPaiInfo[];
}

export interface NoTileScoreInfo {
	seat: number;
	old_scores: number[];
	delta_scores: number[];
	hand: string[];
	ming: string[];
	doras: string[];
	score: number;
}

export interface RecordNoTile {
	liujumanguan: boolean;
	players: NoTilePlayerInfo[];
	scores: NoTileScoreInfo[];
	gameend: boolean;
	muyu: MuyuInfo;
}

export interface FanInfo {
	name: string;
	val: number;
	id: number;
}

export interface HuleInfo {
	hand: string[];
	ming: string[];
	hu_tile: string;
	seat: number;
	zimo: boolean;
	qinjia: boolean;
	liqi: boolean;
	doras: string[];
	li_doras: string[];
	yiman: boolean;
	count: number;
	fans: FanInfo[];
	fu: number;
	title: string;
	point_rong: number;
	point_zimo_qin: number;
	point_zimo_xian: number;
	title_id: number;
	point_sum: number;
}

export interface GameEnd {
	scores: number[];
}

export interface RecordHule {
	hules: HuleInfo[];
	old_scores: number[];
	delta_scores: number[];
	wait_timeout: number;
	scores: number[];
	gameend: GameEnd;
	doras: string[];
	muyu: MuyuInfo;
}

export type Record = RecordNewRound
	| RecordDiscardTile
	| RecordDealTile
	| RecordAnGangAddGang
	| RecordChiPengGang
	| RecordLiuJu
	| RecordNoTile
	| RecordHule;

export interface GameRecordResponse {
	error?: Error;
	head: RecordGame;
	data: Record[];
	data_url: string;
}
