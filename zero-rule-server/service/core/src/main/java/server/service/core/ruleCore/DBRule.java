package server.service.core.ruleCore;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;

public class DBRule {

    public String getDbRule(String dbRuleNm) throws Exception
    {
        Connection conn = null; // DB연결된 상태(세션)을 담은 객체
        PreparedStatement pstm = null;  // SQL 문을 나타내는 객체
        ResultSet rs = null;  // 쿼리문을 날린것에 대한 반환값을 담을 객체
        String sql;
        String result = null;
        try {
            // SQL 문장을 만들고 만약 문장이 질의어(SELECT문)라면
            // 그 결과를 담을 ResulSet 객체를 준비한 후 실행시킨다.
            sql =       "SELECT B.CONDITION_INFIX_DESC   ";
            sql = sql + "  FROM RULE A                   ";
            sql = sql + "     , RULECONDITION B          ";
            sql = sql + " WHERE A.RULEID = B.RULEID      ";
            sql = sql + "   AND A.RULEID = ?            ";

            System.out.println(sql);
            System.out.println("dbRuleNm:"+dbRuleNm);
            conn = DBConnection.getConnection();
            pstm = conn.prepareStatement(sql);
            pstm.setString(1, dbRuleNm);
            rs = pstm.executeQuery();

            /*  EMP 테이블의 데이터 타입
             *
                EMPNO NOT NULL NUMBER(4) -- int
                ENAME VARCHAR2(10) -- String
                JOB VARCHAR2(9) -- String
                MGR NUMBER(4) -- int
                HIREDATE DATE -- Date
                SAL NUMBER(7,2) -- float/double
                COMM NUMBER(7,2) -- float/double
                DEPTNO NUMBER(2) -- int
            */
            rs.next();
            String dbruleQuery = rs.getString(1);
            result = dbruleQuery;
        } catch (SQLException sqle) {
//            System.out.println("SELECT문에서 예외 발생....");
            sqle.printStackTrace();

        }finally{
            // DB 연결을 종료한다.
            try{
                if ( rs != null ){rs.close();}
                if ( pstm != null ){pstm.close();}
                if ( conn != null ){conn.close(); }
            }catch(Exception e){
                throw new RuntimeException(e.getMessage());
            }

        }
        return result;
    }

    public ArrayList<String> getRuleResult(String dbruleQuery, String strParam){
        Connection conn = null; // DB연결된 상태(세션)을 담은 객체
        PreparedStatement pstm = null;  // SQL 문을 나타내는 객체
        ResultSet rs = null;  // 쿼리문을 날린것에 대한 반환값을 담을 객체
        String query;
        ArrayList<String> result = new ArrayList<String>();
        try {
            // SQL 문장을 만들고 만약 문장이 질의어(SELECT문)라면
            // 그 결과를 담을 ResulSet 객체를 준비한 후 실행시킨다.
            query = dbruleQuery;
//            System.out.println("============================================");
            System.out.println("db룰 query :"+query);

            conn = DBConnection.getConnection();
            pstm = conn.prepareStatement(query);
            rs = pstm.executeQuery();


            while(rs.next()) {
                result.add(rs.getString(1));
            }
            System.out.println("db룰결과:"+result);
//            System.out.println("============================================");

        } catch (SQLException sqle) {
//            System.out.println("SELECT문에서 예외 발생....");
            sqle.printStackTrace();

        }finally{
            // DB 연결을 종료한다.
            try{
                if ( rs != null ){rs.close();}
                if ( pstm != null ){pstm.close();}
                if ( conn != null ){conn.close(); }
            }catch(Exception e){
                throw new RuntimeException(e.getMessage());
            }

        }
        return result;
    }

}
