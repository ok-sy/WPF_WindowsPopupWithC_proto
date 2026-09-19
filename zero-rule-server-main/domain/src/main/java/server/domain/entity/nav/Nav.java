package server.domain.entity.nav;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;

/**
 * 메뉴 모음
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Nav {

	/**
	 * PK1, 메뉴ID, 일련번호
	 */
	private long navId;

	/**
	 * 메뉴 이름
	 */
	@NonNull
	private String navNm;

	/**
	 * 설명
	 */
	@Nullable
	private String expl;
}
