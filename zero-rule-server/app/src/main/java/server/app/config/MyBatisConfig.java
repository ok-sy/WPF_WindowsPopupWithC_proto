package server.app.config;

import com.google.common.base.Joiner;
import org.apache.commons.lang3.ArrayUtils;
import org.apache.ibatis.session.SqlSessionFactory;
import org.mybatis.spring.SqlSessionFactoryBean;
import org.mybatis.spring.SqlSessionTemplate;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import server.base.BuildVars;

import javax.sql.DataSource;
import java.util.Arrays;
import java.util.List;

@Configuration
@MapperScan(
    basePackages = {
        BuildVars.Package.repo,
        BuildVars.FrameworkPackage.impl + ".repo",
    }
)
public class MyBatisConfig {

    @Autowired
    ApplicationContext applicationCtx;

    @Bean
    public SqlSessionFactory sqlSessionFactory(DataSource dataSource) throws Exception {
        SqlSessionFactoryBean factoryBean = new SqlSessionFactoryBean();
        factoryBean.setDataSource(dataSource);
        factoryBean.setConfigLocation(applicationCtx.getResource("classpath:mybatis-config.xml"));

        factoryBean.setMapperLocations(
            ArrayUtils.addAll(
                applicationCtx.getResources("classpath:mappers/**/*.xml"),
                applicationCtx.getResources("classpath:cloverframework_mappers/**/*.xml")
            )
        );
        List<String> typePackages = Arrays.asList(
            BuildVars.Package.domain + ".entity",
            BuildVars.Package.domain + ".vo",
            BuildVars.Package.domain + ".sqlparam"
        );
        factoryBean.setTypeAliasesPackage(Joiner.on(",").join(typePackages));
        // factoryBean.setPlugins(mybatisAuditInterceptor);

        return factoryBean.getObject();
    }

    @Bean
    public SqlSessionTemplate sqlSessionTemplate(SqlSessionFactory sqlSessionFactory) {
        return new SqlSessionTemplate(sqlSessionFactory);
    }
}
