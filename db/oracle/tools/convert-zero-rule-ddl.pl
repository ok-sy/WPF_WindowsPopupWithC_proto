#!/usr/bin/perl
# =====================================================================
#  ERD/01_schema.sql 의 zero_rule 공통 스키마(PostgreSQL) → Oracle DDL 변환기
# =====================================================================
#  용도 : zeroserver를 Oracle에서 기동하려면 popup 스키마 외에 zero 프레임워크 공통 테이블(53개)도 필요하다.
#         공통 스키마는 원래 Oracle에서 PostgreSQL로 옮겨진 것(01_schema.sql 주석 "Oracle table: ...")이라
#         구조가 규칙적이므로 스크립트로 되돌린다. 이 변환은 개발 서버 기동·연동 검증용이며,
#         운영 공통 스키마는 기존 Oracle 운영 DB의 것을 사용한다(이 저장소 범위 밖).
#  실행 : perl convert-zero-rule-ddl.pl ../../../ERD/01_schema.sql > ../10_zero_rule_common_schema_oracle.sql
#  변환 규칙
#    CREATE TABLE IF NOT EXISTS zero_rule.t (...)      → CREATE TABLE t (...)  (ZERO_RULE 계정으로 실행)
#    BIGINT→NUMBER(19), INTEGER→NUMBER(10), SMALLINT→NUMBER(5), VARCHAR(n)→VARCHAR2(n CHAR), TEXT→CLOB,
#    BYTEA→BLOB, NUMERIC(p,s)→NUMBER(p,s), NUMERIC→NUMBER, TIMESTAMP→TIMESTAMP(6)
#    ALTER TABLE t ALTER COLUMN c SET NOT NULL          → ALTER TABLE t MODIFY (c NOT NULL)
#    DO $ddl$ ... ALTER TABLE t ADD CONSTRAINT ... $ddl$ → ALTER TABLE t ADD CONSTRAINT ... (블록 밖으로 추출)
#    CREATE UNIQUE INDEX IF NOT EXISTS                  → CREATE UNIQUE INDEX
#    CREATE SEQUENCE IF NOT EXISTS s; ALTER SEQUENCE s ... → CREATE SEQUENCE s INCREMENT BY 1 MINVALUE 1 NOCYCLE CACHE 20
#    Oracle 예약어 컬럼(예: COMMENT, LEVEL, SIZE, DATE ...)은 큰따옴표로 감싼다 (발견 시 목록에 추가)
# =====================================================================
use strict;
use warnings;

my $file = shift or die "usage: $0 01_schema.sql\n";
open(my $fh, '<:encoding(UTF-8)', $file) or die "cannot open $file: $!";
my @lines = <$fh>;
close $fh;

# popup 스키마 시작 전까지만 (zero_rule 부분)
my @zero;
for my $l (@lines) {
    last if $l =~ /^CREATE SCHEMA IF NOT EXISTS popup;/;
    push @zero, $l;
}

# Oracle 예약어(컬럼명으로 쓰이면 따옴표 필요). 필요 시 추가.
my %reserved = map { $_ => 1 } qw(COMMENT LEVEL SIZE DATE ORDER USER GROUP SELECT TABLE FROM WHERE DESC ASC INDEX FILE ACCESS
    AUDIT COLUMN CURRENT DEFAULT DELETE DROP ELSE EXISTS FOR GRANT HAVING IN INTO IS LIKE LOCK LONG MODE NOT NULL NUMBER OF ON
    OPTION OR PRIOR PUBLIC RAW RENAME RESOURCE ROW ROWS SESSION SET SHARE START SYNONYM THEN TO TRIGGER UID UNION UNIQUE UPDATE
    VALUES VIEW WITH MINUS MODIFY ONLINE OFFLINE PCTFREE INITIAL INCREMENT SUCCESSFUL VALIDATE IDENTIFIED IMMEDIATE INTEGER
    CHAR VARCHAR2 DECIMAL FLOAT SMALLINT DISTINCT CLUSTER COMPRESS NOCOMPRESS NOWAIT NOAUDIT EXCLUSIVE INTERSECT ANY ALL AS
    BETWEEN BY CHECK CONNECT CREATE INSERT REVOKE ROWID ROWNUM ROWLABEL SQLBUF WHENEVER);

sub conv_type {
    my ($t) = @_;
    my $u = uc $t;
    return 'NUMBER(19)'          if $u eq 'BIGINT';
    return 'NUMBER(10)'          if $u eq 'INTEGER';
    return 'NUMBER(5)'           if $u eq 'SMALLINT';
    return 'CLOB'                if $u eq 'TEXT';
    return 'BLOB'                if $u eq 'BYTEA';
    return 'TIMESTAMP(6)'        if $u =~ /^TIMESTAMP/;
    return "VARCHAR2($1 CHAR)"   if $u =~ /^VARCHAR\((\d+)\)$/;
    return "CHAR($1)"            if $u =~ /^CHAR\((\d+)\)$/;
    return "NUMBER($1)"          if $u =~ /^NUMERIC\(([\d, ]+)\)$/;
    return 'NUMBER'              if $u eq 'NUMERIC';
    return 'DATE'                if $u eq 'DATE';
    return 'NUMBER(1)'           if $u eq 'BOOLEAN';
    return $t;
}

sub quote_col {
    my ($c) = @_;
    return $reserved{uc $c} ? "\"" . uc($c) . "\"" : $c;
}

my @out;
push @out, "-- =====================================================================";
push @out, "--  ZERO_RULE 공통 스키마 — Oracle DDL (ERD/01_schema.sql 의 zero_rule 부분을 tools/convert-zero-rule-ddl.pl 로 변환)";
push @out, "--  용도 : 개발 서버(zeroserver) 기동·WPF 연동 검증. 운영은 기존 Oracle 공통 스키마 사용.";
push @out, "--  실행 : sqlplus zero_rule/<pw>\@//host:1521/XEPDB1 \@10_zero_rule_common_schema_oracle.sql";
push @out, "--  생성 : " . scalar(localtime);
push @out, "-- =====================================================================";
push @out, "";

my $i = 0;
my $n = scalar @zero;
my (@tables, @notnull, @constraints, @indexes, @sequences);
while ($i < $n) {
    my $l = $zero[$i];

    if ($l =~ /^CREATE TABLE IF NOT EXISTS zero_rule\.(\w+) \(/) {
        my $table = uc $1;
        my @cols;
        $i++;
        while ($i < $n && $zero[$i] !~ /^\);/) {
            my $c = $zero[$i]; $i++;
            $c =~ s/^\s+|\s+$//g; $c =~ s/,$//;
            next if $c eq '';
            if ($c =~ /^(\w+)\s+(.+)$/) {
                my ($name, $rest) = ($1, $2);
                my ($type, $tail) = $rest =~ /^([A-Za-z]+(?:\s+WITH(?:OUT)? TIME ZONE)?(?:\([\d, ]+\))?)(.*)$/;
                $type //= $rest; $tail //= '';
                $tail =~ s/\bCURRENT_TIMESTAMP\b/SYSTIMESTAMP/g;
                push @cols, sprintf("    %-28s %s%s", quote_col($name), conv_type($type), $tail);
            }
        }
        push @tables, "CREATE TABLE $table\n(\n" . join(",\n", @cols) . "\n);";
        $i++;
        next;
    }
    if ($l =~ /^ALTER TABLE zero_rule\.(\w+) ALTER COLUMN (\w+) SET NOT NULL;/) {
        push @notnull, "ALTER TABLE " . uc($1) . " MODIFY (" . quote_col($2) . " NOT NULL);";
        $i++; next;
    }
    if ($l =~ /^\s*ALTER TABLE zero_rule\.(\w+)\s*$/) {
        # DO 블록 안의 여러 줄 ALTER ... ADD CONSTRAINT
        my $stmt = "ALTER TABLE " . uc($1);
        $i++;
        while ($i < $n && $zero[$i] !~ /;/) { my $s = $zero[$i]; $s =~ s/^\s+|\s+$//g; $stmt .= " $s"; $i++; }
        if ($i < $n) { my $s = $zero[$i]; $s =~ s/^\s+|\s+$//g; $stmt .= " $s"; $i++; }
        $stmt =~ s/\s+/ /g;
        push @constraints, $stmt if $stmt =~ /ADD CONSTRAINT/;
        next;
    }
    if ($l =~ /^ALTER TABLE zero_rule\.(\w+) ADD CONSTRAINT (.+);/) {
        push @constraints, "ALTER TABLE " . uc($1) . " ADD CONSTRAINT $2;";
        $i++; next;
    }
    if ($l =~ /^CREATE UNIQUE INDEX IF NOT EXISTS (\w+) ON zero_rule\.(\w+) \((.+)\);/) {
        push @indexes, "CREATE UNIQUE INDEX " . uc($1) . " ON " . uc($2) . " ($3);";
        $i++; next;
    }
    if ($l =~ /^CREATE SEQUENCE IF NOT EXISTS zero_rule\.(\w+);/) {
        push @sequences, "CREATE SEQUENCE " . uc($1) . " INCREMENT BY 1 MINVALUE 1 NOCYCLE CACHE 20;";
        $i++; next;
    }
    $i++;
}

# 인덱스 이름이 제약 이름과 겹치거나(Oracle은 같은 이름의 인덱스가 이미 있으면 실패) 같은 컬럼 목록의 PK/UK가 있으면 생략한다.
my %constraint_names = map { /ADD CONSTRAINT (\w+)/ ? (uc $1 => 1) : () } @constraints;
my %constraint_cols = map { /ADD CONSTRAINT \S+ (?:PRIMARY KEY|UNIQUE) \((.+?)\)/ ? (lc($1) =~ s/\s//gr => 1) : () } @constraints;
my @kept_indexes;
for my $ix (@indexes) {
    my ($name, $table, $cols) = $ix =~ /INDEX (\w+) ON (\w+) \((.+)\)/;
    my $key = lc($cols) =~ s/\s//gr;
    if ($constraint_names{$name} || $constraint_cols{$key}) {
        push @kept_indexes, "-- 생략(PK/UK 인덱스와 중복): $ix";
    } else {
        push @kept_indexes, $ix;
    }
}

push @out, "-- 1. TABLES (" . scalar(@tables) . ")", "", @tables, "";
push @out, "-- 2. NOT NULL (" . scalar(@notnull) . ")", "", @notnull, "";
push @out, "-- 3. PRIMARY KEY / UNIQUE (" . scalar(@constraints) . ")", "", @constraints, "";
push @out, "-- 4. INDEXES (" . scalar(@indexes) . ")", "", @kept_indexes, "";
push @out, "-- 5. SEQUENCES (" . scalar(@sequences) . ")", "", @sequences, "";
push @out, "COMMIT;", "EXIT";
binmode(STDOUT, ':encoding(UTF-8)');
print join("\n", @out), "\n";
