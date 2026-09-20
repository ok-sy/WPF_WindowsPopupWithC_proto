package server.app.config;

import com.google.common.base.Joiner;
import org.apache.commons.lang3.ArrayUtils;
import org.apache.ibatis.session.SqlSessionFactory;
import org.mybatis.spring.SqlSessionFactoryBean;
import org.mybatis.spring.SqlSessionTemplate;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import server.base.BuildVars;
import server.repo.core.mapper.popup.PopupSchema;

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

    // [WPF 팝업 — 추가] 팝업 테이블 스키마 한정자. 기본 POPUP(설계), 빈 값이면 접속 계정 스키마(PopupSchema 참조).
    @Value("${" + PopupSchema.CONFIG_KEY + ":" + PopupSchema.DEFAULT_SCHEMA + "}")
    private String popupSchema;

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

        // [WPF 팝업 — 추가, 2026-09-20 스키마 분리 설정화] 팝업 매퍼 XML의 ${popupSchemaPrefix}에 설정
        // custom.popup.schema(기본 POPUP → "POPUP.", 빈 값 → "" = 접속 계정 스키마)를 공급한다.
        // 다른 매퍼는 이 변수를 쓰지 않으므로 기존 동작에 영향이 없다. 계산 규칙은 PopupSchema 참조.
        factoryBean.setConfigurationProperties(PopupSchema.variables(popupSchema));

        return factoryBean.getObject();
    }

    @Bean
    public SqlSessionTemplate sqlSessionTemplate(SqlSessionFactory sqlSessionFactory) {
        return new SqlSessionTemplate(sqlSessionFactory);
    }
}
