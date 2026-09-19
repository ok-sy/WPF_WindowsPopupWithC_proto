package server.service.core.ruleCore;

import java.sql.Connection;
import java.sql.SQLException;

import oracle.jdbc.pool.*;

public class DBConnection {

    // Data source for the pooled connection
    private static OracleDataSource dataSource;
    // Host
    private static final String dbHost = "192.168.114.71";
    // Port
    private static final String dbPort = "4004";
    // DBname
    private static final String database = "xe";
    // DBuser
    private static final String dbUser = "rule";
    // DBpassword
    private static final String dbPassword = "Rule4321!";
    static {
        //OracleConnectionPoolDataSource opds;
        try {
            // set cache properties

            java.util.Properties prop = new java.util.Properties();
            prop.setProperty("MinLimit", "2");       //min pool size
            prop.setProperty("MaxLimit", "20");    //max pool size

            // set DataSource properties
            OracleDataSource ods = new OracleDataSource();
            String url = "jdbc:oracle:thin:@" + dbHost + ":" + dbPort + ":"+ database;
            ods.setURL(url);
            ods.setUser(dbUser);
            ods.setPassword(dbPassword);
            /*
             * ods.setConnectionCachingEnabled(true); // be sure set to true
             * ods.setConnectionCacheProperties (prop);
             * ods.setConnectionCacheName("rocksea"); // this cache's name
             */
            dataSource = ods;
        } catch (SQLException e1) {
            System.err.println("Connection failed!");
        }

        try {
            // Load driver
            Class.forName("oracle.jdbc.driver.OracleDriver");
        } catch (ClassNotFoundException e) {
            System.out.println("Driver not found!");
        }
    }

    public static Connection getConnection() throws SQLException {
        return dataSource.getConnection();
    }
}